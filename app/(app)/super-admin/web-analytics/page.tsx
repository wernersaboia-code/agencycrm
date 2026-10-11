import Link from "next/link"
import { Eye, Globe2, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VercelAnalyticsChart } from "@/components/admin/vercel-analytics-chart"
import { CountryAnalytics } from "@/components/admin/country-analytics"
import { AnalyticsRanking, AnalyticsTabbedRanking } from "@/components/admin/analytics-ranking"
import { getAdminLocale, getAdminTranslations } from "@/lib/i18n/admin-locale"
import { getVercelWebAnalytics, type VercelAnalyticsFilters } from "@/lib/analytics/vercel-web-analytics"
import type { VisitasDoEstudo } from "@/lib/analytics/visitas-por-estudo"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function generateMetadata() {
    const t = await getAdminTranslations("admin.analytics")
    return { title: t("vercelTitle"), description: t("vercelSubtitle") }
}

function selected(value: string | undefined, max = 200) {
    return value?.trim().slice(0, max) || undefined
}

export default async function WebAnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const params = await searchParams
    const requestedDays = Number(params.days)
    const days: 1 | 7 | 30 | 90 = requestedDays === 1 || requestedDays === 7 || requestedDays === 90 ? requestedDays : 30
    const filters: VercelAnalyticsFilters = {
        days,
        path: selected(params.path),
        country: selected(params.country, 10),
        device: selected(params.device, 50),
        browser: selected(params.browser, 80),
        referrer: selected(params.referrer),
        study: selected(params.study),
    }
    const [data, locale, t, estudos] = await Promise.all([
        getVercelWebAnalytics(filters),
        getAdminLocale(),
        getAdminTranslations("admin.analytics"),
        // Todos os estudos do catálogo, não só os visitados: o filtro também
        // serve para confirmar que um estudo não teve visita nenhuma.
        prisma.leadList.findMany({
            where: { isActive: true, studyPdfUrl: { not: null } },
            select: { slug: true, name: true },
            orderBy: { name: "asc" },
        }),
    ])
    const nomeDoEstudo = new Map(estudos.map((estudo) => [estudo.slug, estudo.name]))
    const linhasDeEstudo = data.studies.map((estudo) => linhaDeEstudo(estudo, nomeDoEstudo))

    const viewsPerVisitor = data.visitors > 0 ? (data.pageviews / data.visitors).toFixed(1) : "0"

    return (
        <div className="space-y-6">
            <div><h1 className="text-3xl font-bold tracking-tight">{t("vercelTitle")}</h1><p className="text-muted-foreground">{t("vercelSubtitle")}</p></div>

            <Card>
                <CardHeader><CardTitle className="text-base">{t("filters")}</CardTitle></CardHeader>
                <CardContent>
                    <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <FilterSelect name="days" label={t("period")} value={String(days)} allLabel={t("all")} options={[{ value: "1", label: t("last24Hours") }, ...[7, 30, 90].map((count) => ({ value: String(count), label: t("days", { count }) }))]} />
                        <FilterSelect name="study" label={t("study")} value={filters.study} allLabel={t("all")} options={estudos.map((estudo) => ({ value: estudo.slug, label: estudo.name }))} />
                        <FilterSelect name="path" label={t("page")} value={filters.path} allLabel={t("all")} options={data.filterOptions.pages.map((value) => ({ value, label: value }))} />
                        <FilterSelect name="country" label={t("country")} value={filters.country} allLabel={t("all")} options={data.filterOptions.countries.map((value) => ({ value, label: `${countryFlag(value)} ${countryName(value, locale)}` }))} />
                        <FilterSelect name="device" label={t("devices")} value={filters.device} allLabel={t("all")} options={data.filterOptions.devices.map((value) => ({ value, label: value }))} />
                        <FilterSelect name="browser" label={t("browsers")} value={filters.browser} allLabel={t("all")} options={data.filterOptions.browsers.map((value) => ({ value, label: value }))} />
                        <FilterSelect name="referrer" label={t("referrer")} value={filters.referrer} allLabel={t("all")} options={data.filterOptions.referrers.map((value) => ({ value, label: value }))} />
                        <div className="flex gap-2 md:col-span-2 xl:col-span-4"><Button type="submit">{t("applyFilters")}</Button><Button variant="outline" asChild><Link href="/super-admin/web-analytics">{t("clearFilters")}</Link></Button></div>
                    </form>
                </CardContent>
            </Card>

            {data.status !== "ready" ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">{data.status === "not_configured" ? t("vercelNotConfigured") : t("vercelError")}</CardContent></Card>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Kpi title={t("pageviews")} value={data.pageviews.toLocaleString()} icon={Eye} />
                        <Kpi title={t("visitors")} value={data.visitors.toLocaleString()} icon={Users} />
                        <Kpi title={t("viewsPerVisitor")} value={viewsPerVisitor} icon={Globe2} />
                    </div>
                    <p className="text-sm text-muted-foreground">{t("bounceRateUnavailable")}</p>
                    <p className="text-sm text-muted-foreground">{t("visitorsMeaning")}</p>
                    <p className="text-sm text-muted-foreground">{t("teamExcluded")}</p>
                    <Card><CardHeader><CardTitle>{days === 1 ? t("trafficLast24Hours") : t("trafficEvolution")}</CardTitle></CardHeader><CardContent><VercelAnalyticsChart data={data.daily} /></CardContent></Card>
                    <AnalyticsRanking title={t("topStudies")} rows={linhasDeEstudo} total={linhasDeEstudo.reduce((soma, linha) => soma + linha.pageviews, 0)} base="pageviews" labels={{ ...rankingLabels(t, "topStudies", linhasDeEstudo.length), dialogDescription: t("topStudiesDesc") }} emptyLabel={t("noStudyVisits")} />
                    <div className="grid gap-6 xl:grid-cols-2"><AnalyticsRanking title={t("topPagesVercel")} rows={data.allPages} total={data.visitors} labels={rankingLabels(t, "topPagesVercel", data.allPages.length)} /><CountryAnalytics rows={data.allCountries} total={data.visitors} locale={locale} labels={{ title: t("countries"), viewAll: t("viewAllCountries", { count: data.allCountries.length }), dialogTitle: t("allCountries"), dialogDescription: t("allCountriesDesc") }} /></div>
                    <div className="grid gap-6 xl:grid-cols-3"><AnalyticsRanking title={t("topReferrers")} rows={data.allReferrers} total={data.visitors} labels={rankingLabels(t, "topReferrers", data.allReferrers.length)} /><AnalyticsTabbedRanking total={data.visitors} primary={{ title: t("devices"), rows: data.allDevices, labels: rankingLabels(t, "devices", data.allDevices.length) }} secondary={{ title: t("browsers"), rows: data.allBrowsers, labels: rankingLabels(t, "browsers", data.allBrowsers.length) }} /><AnalyticsRanking title={t("operatingSystems")} rows={data.allOperatingSystems} total={data.visitors} labels={rankingLabels(t, "operatingSystems", data.allOperatingSystems.length)} /></div>
                </>
            )}
        </div>
    )
}

function FilterSelect({ name, label, value, allLabel, options }: { name: string; label: string; value?: string; allLabel: string; options: { value: string; label: string }[] }) {
    return <label className="space-y-1 text-sm font-medium"><span>{label}</span><select name={name} defaultValue={value || ""} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">{allLabel}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}

function Kpi({ title, value, icon: Icon }: { title: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
    return <Card><CardContent className="flex items-center justify-between py-5"><div><p className="text-sm text-muted-foreground">{title}</p><p className="text-3xl font-bold">{value}</p></div><Icon className="h-7 w-7 text-admin" /></CardContent></Card>
}

function rankingLabels(t: Awaited<ReturnType<typeof getAdminTranslations>>, titleKey: string, count: number) {
    const title = t(titleKey)
    return { viewAll: t("viewAllItems", { count }), dialogTitle: title, dialogDescription: t("allItemsDesc", { title }) }
}

/** Nome do estudo e o detalhe por idioma ("DE 6 · EN 1"); slug quando o estudo saiu do catálogo. */
function linhaDeEstudo(estudo: VisitasDoEstudo, nomes: Map<string, string>) {
    const idiomas = Object.entries(estudo.porIdioma)
        .sort(([, a], [, b]) => b - a)
        .map(([idioma, vistas]) => `${idioma.toUpperCase()} ${vistas}`)
        .join(" · ")
    return { label: `${nomes.get(estudo.slug) ?? estudo.slug} — ${idiomas}`, pageviews: estudo.pageviews, visitors: estudo.visitors }
}

function countryFlag(code: string) { return /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0))) : "🌐" }
function countryName(code: string, locale: string) { try { return new Intl.DisplayNames([locale], { type: "region" }).of(code) || code } catch { return code } }
