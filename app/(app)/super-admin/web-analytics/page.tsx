import Link from "next/link"
import { Eye, Globe2, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VercelAnalyticsChart } from "@/components/admin/vercel-analytics-chart"
import { CountryAnalytics } from "@/components/admin/country-analytics"
import { AnalyticsRanking, AnalyticsTabbedRanking } from "@/components/admin/analytics-ranking"
import { getAdminLocale, getAdminTranslations } from "@/lib/i18n/admin-locale"
import { getVercelWebAnalytics, type VercelAnalyticsFilters } from "@/lib/analytics/vercel-web-analytics"

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
    }
    const [data, locale, t] = await Promise.all([
        getVercelWebAnalytics(filters),
        getAdminLocale(),
        getAdminTranslations("admin.analytics"),
    ])

    const viewsPerVisitor = data.visitors > 0 ? (data.pageviews / data.visitors).toFixed(1) : "0"

    return (
        <div className="space-y-6">
            <div><h1 className="text-3xl font-bold tracking-tight">{t("vercelTitle")}</h1><p className="text-muted-foreground">{t("vercelSubtitle")}</p></div>

            <Card>
                <CardHeader><CardTitle className="text-base">{t("filters")}</CardTitle></CardHeader>
                <CardContent>
                    <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                        <FilterSelect name="days" label={t("period")} value={String(days)} allLabel={t("all")} options={[{ value: "1", label: t("last24Hours") }, ...[7, 30, 90].map((count) => ({ value: String(count), label: t("days", { count }) }))]} />
                        <FilterSelect name="path" label={t("page")} value={filters.path} allLabel={t("all")} options={data.filterOptions.pages.map((value) => ({ value, label: value }))} />
                        <FilterSelect name="country" label={t("country")} value={filters.country} allLabel={t("all")} options={data.filterOptions.countries.map((value) => ({ value, label: `${countryFlag(value)} ${countryName(value, locale)}` }))} />
                        <FilterSelect name="device" label={t("devices")} value={filters.device} allLabel={t("all")} options={data.filterOptions.devices.map((value) => ({ value, label: value }))} />
                        <FilterSelect name="browser" label={t("browsers")} value={filters.browser} allLabel={t("all")} options={data.filterOptions.browsers.map((value) => ({ value, label: value }))} />
                        <FilterSelect name="referrer" label={t("referrer")} value={filters.referrer} allLabel={t("all")} options={data.filterOptions.referrers.map((value) => ({ value, label: value }))} />
                        <div className="flex gap-2 md:col-span-2 xl:col-span-6"><Button type="submit">{t("applyFilters")}</Button><Button variant="outline" asChild><Link href="/super-admin/web-analytics">{t("clearFilters")}</Link></Button></div>
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
                    <Card><CardHeader><CardTitle>{days === 1 ? t("trafficLast24Hours") : t("trafficEvolution")}</CardTitle></CardHeader><CardContent><VercelAnalyticsChart data={data.daily} /></CardContent></Card>
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

function countryFlag(code: string) { return /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0))) : "🌐" }
function countryName(code: string, locale: string) { try { return new Intl.DisplayNames([locale], { type: "region" }).of(code) || code } catch { return code } }
