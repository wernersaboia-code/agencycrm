import Link from "next/link"
import { BarChart3, MousePointerClick, Search, Target } from "lucide-react"
import { requireAdmin } from "@/lib/auth"
import { getGoogleSearchConsoleAnalytics, type SearchConsoleRow } from "@/lib/analytics/google-search-console"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { countryLabel } from "@/lib/countries"

export const dynamic = "force-dynamic"

export default async function SearchConsolePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const user = await requireAdmin()
    const params = await searchParams
    const requested = Number(params.days)
    const days = requested === 7 || requested === 90 ? requested : 28
    const data = await getGoogleSearchConsoleAnalytics(user.id, days)

    return <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div><h1 className="text-3xl font-bold tracking-tight">Google Search Console</h1><p className="text-muted-foreground">Desempenho orgânico do Google para o Easy Prospect.</p></div>
            {data.status === "ready" && <Button variant="outline" asChild><Link href="/api/google-search-console/connect">Reconectar conta</Link></Button>}
        </div>

        {data.status !== "ready" ? <ConnectionState status={data.status} error={params.error} /> : <>
            <Card><CardContent className="flex flex-wrap items-end justify-between gap-3 py-4"><div><p className="text-sm font-medium">Propriedade conectada</p><p className="text-sm text-muted-foreground">{data.siteUrl}</p></div><div className="flex gap-2">{[7, 28, 90].map((value) => <Button key={value} size="sm" variant={value === days ? "default" : "outline"} asChild><Link href={`/super-admin/search-console?days=${value}`}>{value} dias</Link></Button>)}</div></CardContent></Card>
            <div className="grid gap-4 md:grid-cols-4"><Kpi title="Cliques" value={data.clicks.toLocaleString()} icon={MousePointerClick} /><Kpi title="Impressões" value={data.impressions.toLocaleString()} icon={Search} /><Kpi title="CTR médio" value={`${(data.ctr * 100).toFixed(1)}%`} icon={Target} /><Kpi title="Posição média" value={data.position.toFixed(1)} icon={BarChart3} /></div>
            <Card><CardHeader><CardTitle>Evolução diária</CardTitle></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{data.daily.map((item) => <div key={item.date} className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{item.date}</p><p className="font-semibold">{item.clicks} cliques</p><p className="text-sm text-muted-foreground">{item.impressions} impressões</p></div>)}</div></CardContent></Card>
            <div className="grid gap-6 xl:grid-cols-2"><Ranking title="Consultas mais encontradas" rows={data.queries} /><Ranking title="Páginas com melhor desempenho" rows={data.pages} /></div>
            <div className="grid gap-6 xl:grid-cols-2"><Ranking title="Países" rows={data.countries} countryRows /><Ranking title="Dispositivos" rows={data.devices} /></div>
        </>}
    </div>
}

function ConnectionState({ status, error }: { status: string; error?: string }) {
    const unavailable = status === "not_configured"
    return <Card><CardContent className="space-y-4 py-8 text-center"><p className="text-lg font-semibold">{unavailable ? "Configuração OAuth pendente" : "Conecte o Google Search Console"}</p><p className="mx-auto max-w-xl text-sm text-muted-foreground">{error ? "Não foi possível concluir a conexão. Tente novamente." : unavailable ? "Cadastre GOOGLE_SEARCH_CONSOLE_CLIENT_ID e GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET na Vercel e faça um redeploy." : "Autorize a conta proprietária da propriedade do Easy Prospect para exibir cliques, impressões, consultas e páginas."}</p>{!unavailable && <Button asChild><Link href="/api/google-search-console/connect">Conectar Google Search Console</Link></Button>}</CardContent></Card>
}

function Kpi({ title, value, icon: Icon }: { title: string; value: string; icon: React.ComponentType<{ className?: string }> }) { return <Card><CardContent className="flex items-center justify-between py-5"><div><p className="text-sm text-muted-foreground">{title}</p><p className="text-3xl font-bold">{value}</p></div><Icon className="h-7 w-7 text-admin" /></CardContent></Card> }

function Ranking({ title, rows, countryRows = false }: { title: string; rows: SearchConsoleRow[]; countryRows?: boolean }) {
    const preview = rows.slice(0, 10)
    return <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>{preview.length ? <div className="space-y-3">{preview.map((row) => { const country = countryRows ? countryLabel(row.label) : null; return <div key={row.label} className="flex items-start justify-between gap-4 text-sm"><span className="min-w-0 break-all">{country ? <><span className="mr-2 text-base">{country.flag}</span>{country.name}</> : row.label}</span><span className="shrink-0 text-right"><strong>{row.clicks}</strong> cliques<br /><span className="text-muted-foreground">{row.impressions} impr. · {(row.ctr * 100).toFixed(1)}%</span></span></div> })}</div> : <p className="text-sm text-muted-foreground">Ainda não há dados para este período.</p>}</CardContent></Card>
}
