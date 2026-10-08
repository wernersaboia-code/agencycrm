import Link from "next/link"
import { BarChart3, CircleHelp, MousePointerClick, Search, Target } from "lucide-react"
import { requireAdmin } from "@/lib/auth"
import { getGoogleSearchConsoleAnalytics, type SearchConsoleRow } from "@/lib/analytics/google-search-console"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { countryLabel } from "@/lib/countries"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getAdminLocale, getAdminTranslations } from "@/lib/i18n/admin-locale"
import { htmlLangFor } from "@/lib/i18n/locales"

export const dynamic = "force-dynamic"

type Tradutor = Awaited<ReturnType<typeof getAdminTranslations>>

export default async function SearchConsolePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const user = await requireAdmin()
    const [params, t, locale] = await Promise.all([
        searchParams,
        getAdminTranslations("admin.searchConsole"),
        getAdminLocale(),
    ])
    const requested = Number(params.days)
    const days = requested === 7 || requested === 90 ? requested : 28
    const data = await getGoogleSearchConsoleAnalytics(user.id, days)
    const numero = new Intl.NumberFormat(htmlLangFor(locale))
    const decimal = new Intl.NumberFormat(htmlLangFor(locale), { minimumFractionDigits: 1, maximumFractionDigits: 1 })

    return <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div><h1 className="text-3xl font-bold tracking-tight">Google Search Console</h1><p className="text-muted-foreground">{t("subtitle")}</p></div>
            {data.status === "ready" && <Button variant="outline" asChild><Link href="/api/google-search-console/connect">{t("reconnect")}</Link></Button>}
        </div>

        {data.status !== "ready" ? <ConnectionState status={data.status} error={params.error} t={t} /> : <>
            <Card><CardContent className="flex flex-wrap items-end justify-between gap-3 py-4"><div><p className="text-sm font-medium">{t("property")}</p><p className="text-sm text-muted-foreground">{data.siteUrl}</p></div><div className="flex gap-2">{[7, 28, 90].map((value) => <Button key={value} size="sm" variant={value === days ? "default" : "outline"} asChild><Link href={`/super-admin/search-console?days=${value}`}>{t("days", { count: value })}</Link></Button>)}</div></CardContent></Card>
            <TooltipProvider><div className="grid gap-4 md:grid-cols-4">
                <Kpi title={t("clicks")} value={numero.format(data.clicks)} description={t("clicksDesc")} icon={MousePointerClick} t={t} />
                <Kpi title={t("impressions")} value={numero.format(data.impressions)} description={t("impressionsDesc")} icon={Search} t={t} />
                <Kpi title={t("ctr")} value={`${decimal.format(data.ctr * 100)}%`} description={t("ctrDesc")} icon={Target} t={t} />
                <Kpi title={t("position")} value={decimal.format(data.position)} description={t("positionDesc")} icon={BarChart3} t={t} />
            </div></TooltipProvider>
            <Card><CardHeader><CardTitle>{t("daily")}</CardTitle></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{data.daily.map((item) => <div key={item.date} className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{item.date}</p><p className="font-semibold">{t("clicksCount", { count: item.clicks })}</p><p className="text-sm text-muted-foreground">{t("impressionsCount", { count: item.impressions })}</p></div>)}</div></CardContent></Card>
            <div className="grid gap-6 xl:grid-cols-2"><Ranking title={t("topQueries")} rows={data.queries} t={t} decimal={decimal} /><Ranking title={t("topPages")} rows={data.pages} t={t} decimal={decimal} /></div>
            <div className="grid gap-6 xl:grid-cols-2"><Ranking title={t("countries")} rows={data.countries} countryRows t={t} decimal={decimal} /><Ranking title={t("devices")} rows={data.devices} t={t} decimal={decimal} /></div>
        </>}
    </div>
}

function ConnectionState({ status, error, t }: { status: string; error?: string; t: Tradutor }) {
    const unavailable = status === "not_configured"
    return <Card><CardContent className="space-y-4 py-8 text-center"><p className="text-lg font-semibold">{unavailable ? t("notConfiguredTitle") : t("connectTitle")}</p><p className="mx-auto max-w-xl text-sm text-muted-foreground">{error ? t("connectFailed") : unavailable ? t("notConfiguredDesc") : t("connectDesc")}</p>{!unavailable && <Button asChild><Link href="/api/google-search-console/connect">{t("connect")}</Link></Button>}</CardContent></Card>
}

function Kpi({ title, value, description, icon: Icon, t }: { title: string; value: string; description: string; icon: React.ComponentType<{ className?: string }>; t: Tradutor }) { return <Card><CardContent className="flex items-center justify-between py-5"><div><div className="flex items-center gap-1"><p className="text-sm text-muted-foreground">{title}</p><Tooltip><TooltipTrigger asChild><button type="button" aria-label={t("whatIs", { title })} className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><CircleHelp className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent className="max-w-72" sideOffset={6}>{description}</TooltipContent></Tooltip></div><p className="text-3xl font-bold">{value}</p></div><Icon className="h-7 w-7 text-admin" /></CardContent></Card> }

function Ranking({ title, rows, countryRows = false, t, decimal }: { title: string; rows: SearchConsoleRow[]; countryRows?: boolean; t: Tradutor; decimal: Intl.NumberFormat }) {
    const preview = rows.slice(0, 10)
    return <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>{preview.length ? <div className="space-y-3">{preview.map((row) => { const country = countryRows ? countryLabel(row.label) : null; return <div key={row.label} className="flex items-start justify-between gap-4 text-sm"><span className="min-w-0 break-all">{country ? <><span className="mr-2 text-base">{country.flag}</span>{country.name}</> : row.label}</span><span className="shrink-0 text-right"><strong>{t("clicksCount", { count: row.clicks })}</strong><br /><span className="text-muted-foreground">{t("impressionsShort", { count: row.impressions })} · {decimal.format(row.ctr * 100)}%</span></span></div> })}</div> : <p className="text-sm text-muted-foreground">{t("noData")}</p>}</CardContent></Card>
}
