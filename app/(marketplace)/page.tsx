import Link from "next/link"
import {
    ArrowRight,
    BadgeCheck,
    CheckCircle2,
    CreditCard,
    Database,
    Download,
    FileSpreadsheet,
    Globe2,
    Search,
    ShieldCheck,
    SlidersHorizontal,
} from "lucide-react"
import { getFilterCounts, getMarketplaceLists } from "@/actions/marketplace"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FlagIcon } from "@/components/ui/flag-icon"
import { formatCurrency } from "@/lib/utils"

type HomeList = Awaited<ReturnType<typeof getMarketplaceLists>>["lists"][number]
type FilterCounts = Awaited<ReturnType<typeof getFilterCounts>>

export default async function LeadStoreHome() {
    const { lists, total, filterCounts } = await getHomeCatalogData()

    const countryTotal = Object.keys(filterCounts.countryCounts).length
    const industryTotal = Object.keys(filterCounts.industryCounts).length
    const categoryTotal = Object.keys(filterCounts.categoryCounts).length
    const previewLeadTotal = lists.reduce((sum, list) => sum + list.totalLeads, 0)
    const primaryList = lists[0]

    return (
        <div className="min-h-screen bg-white text-gray-950">
            <section className="border-b border-gray-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_82%)]">
                <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
                        <div className="max-w-3xl">
                            <Badge className="mb-5 rounded-md border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-50">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Marketplace de leads B2B verificados
                            </Badge>

                            <h1 className="text-4xl font-bold tracking-tight text-gray-950 md:text-5xl lg:text-6xl">
                                Compre listas qualificadas para prospecção em comércio exterior.
                            </h1>

                            <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
                                Encontre empresas por país, setor e perfil de compra. Escolha apenas a base
                                que faz sentido para sua campanha e receba os arquivos prontos para uso.
                            </p>

                            <form
                                action="/catalog"
                                className="mt-8 flex max-w-2xl flex-col gap-3 rounded-lg border border-gray-200 bg-white p-2 shadow-sm sm:flex-row"
                            >
                                <label htmlFor="home-search" className="sr-only">
                                    Buscar listas no catálogo
                                </label>
                                <div className="flex min-h-11 flex-1 items-center gap-3 px-3">
                                    <Search className="h-5 w-5 shrink-0 text-gray-400" />
                                    <input
                                        id="home-search"
                                        name="search"
                                        type="search"
                                        placeholder="Busque por país, setor ou tipo de lead"
                                        className="h-11 w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="h-11 bg-emerald-600 px-5 text-white hover:bg-emerald-700"
                                >
                                    Buscar listas
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </form>

                            <div className="mt-6 flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:flex-wrap">
                                <TrustNote icon={CheckCircle2} text="Download imediato em CSV ou Excel" />
                                <TrustNote icon={CreditCard} text="Checkout seguro via PayPal" />
                                <TrustNote icon={BadgeCheck} text="Dados prontos para prospecção" />
                            </div>
                        </div>

                        <HeroCatalogPreview list={primaryList} total={total} previewLeadTotal={previewLeadTotal} />
                    </div>
                </div>
            </section>

            <section className="border-b border-gray-200 bg-white">
                <div className="container mx-auto grid gap-4 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard icon={Database} value={total.toLocaleString("pt-BR")} label="listas ativas" />
                    <MetricCard icon={Globe2} value={countryTotal.toLocaleString("pt-BR")} label="mercados mapeados" />
                    <MetricCard icon={SlidersHorizontal} value={industryTotal.toLocaleString("pt-BR")} label="setores disponíveis" />
                    <MetricCard icon={FileSpreadsheet} value={categoryTotal.toLocaleString("pt-BR")} label="categorias de dados" />
                </div>
            </section>

            <section className="bg-gray-50 py-14 md:py-18">
                <div className="container mx-auto px-4">
                    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                                Catálogo em destaque
                            </p>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                                Comece pela lista certa, não por uma planilha vazia.
                            </h2>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/catalog">
                                Ver catálogo completo
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    {lists.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-3">
                            {lists.map((list) => (
                                <FeaturedListCard key={list.id} list={list} />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                            <Database className="mx-auto h-10 w-10 text-gray-400" />
                            <h3 className="mt-4 text-lg font-semibold text-gray-900">
                                O catálogo está sendo preparado
                            </h3>
                            <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
                                Assim que houver listas ativas, elas aparecerão aqui com volume, mercados e preço.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <section id="como-funciona" className="bg-white py-14 md:py-18">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                            Como funciona
                        </p>
                        <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                            Da busca ao arquivo pronto em três passos.
                        </h2>
                    </div>

                    <div className="mt-10 grid gap-4 md:grid-cols-3">
                        <ProcessStep
                            icon={Search}
                            title="Filtre"
                            description="Navegue por países, setores, categorias e termos específicos para encontrar listas compatíveis com sua campanha."
                        />
                        <ProcessStep
                            icon={ShieldCheck}
                            title="Compre"
                            description="Revise volume, preço por lead e detalhes da lista antes de finalizar o pedido com checkout seguro."
                        />
                        <ProcessStep
                            icon={Download}
                            title="Baixe"
                            description="Depois da confirmação, acesse os arquivos em CSV ou Excel para importar no seu fluxo comercial."
                        />
                    </div>
                </div>
            </section>

            <section className="border-y border-gray-200 bg-gray-950 text-white">
                <div className="container mx-auto grid gap-8 px-4 py-14 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
                            Confiança operacional
                        </p>
                        <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                            Dados compráveis, rastreáveis e prontos para sair do papel.
                        </h2>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-gray-300">
                            A LeadStore combina curadoria de bases B2B com entrega simples: pagamento
                            registrado, downloads na conta e arquivos pensados para prospecção.
                        </p>
                    </div>

                    <div className="grid gap-3">
                        <ConfidenceItem icon={CreditCard} text="Pagamento via PayPal com pedido registrado" />
                        <ConfidenceItem icon={FileSpreadsheet} text="Exportação em formatos compatíveis com CRM" />
                        <ConfidenceItem icon={BadgeCheck} text="Prévia de dados antes da compra" />
                    </div>
                </div>
            </section>

            <section className="bg-white py-14">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-start justify-between gap-6 rounded-lg border border-gray-200 bg-gray-50 p-6 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-gray-950">
                                Pronto para escolher sua próxima base?
                            </h2>
                            <p className="mt-2 text-gray-600">
                                Explore o catálogo e encontre leads qualificados para sua próxima campanha internacional.
                            </p>
                        </div>
                        <Button className="bg-emerald-600 text-white hover:bg-emerald-700" asChild>
                            <Link href="/catalog">
                                Explorar catálogo
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}

async function getHomeCatalogData(): Promise<{
    lists: HomeList[]
    total: number
    filterCounts: FilterCounts
}> {
    try {
        const [{ lists, total }, filterCounts] = await Promise.all([
            getMarketplaceLists({ limit: 3 }),
            getFilterCounts(),
        ])

        return { lists, total, filterCounts }
    } catch (error) {
        console.error("Failed to load marketplace home data", error)

        return {
            lists: [],
            total: 0,
            filterCounts: {
                countryCounts: {},
                industryCounts: {},
                categoryCounts: {},
            },
        }
    }
}

function HeroCatalogPreview({
    list,
    total,
    previewLeadTotal,
}: {
    list?: HomeList
    total: number
    previewLeadTotal: number
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-xl shadow-gray-200/60">
            <div className="mb-4 flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                    <div className="text-sm font-semibold text-gray-900">Prévia do catálogo</div>
                    <div className="text-xs text-gray-500">{total.toLocaleString("pt-BR")} listas disponíveis</div>
                </div>
                <Badge className="rounded-md bg-emerald-600 hover:bg-emerald-600">
                    Atualizado
                </Badge>
            </div>

            {list ? (
                <div className="space-y-4">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
                        <div className="mb-3 flex items-start justify-between gap-4">
                            <div>
                                <Badge variant="outline" className="mb-2 rounded-md bg-white text-emerald-700">
                                    {list.category}
                                </Badge>
                                <h2 className="line-clamp-2 text-lg font-bold text-gray-950">
                                    {list.name}
                                </h2>
                            </div>
                            <CountryCluster countries={list.countries} />
                        </div>
                        <p className="line-clamp-2 text-sm leading-6 text-gray-600">
                            {list.description || "Base pronta para prospecção com empresas qualificadas."}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <MiniStat value={list.totalLeads.toLocaleString("pt-BR")} label="empresas" />
                        <MiniStat value={formatCurrency(list.price, list.currency)} label="preço" />
                        <MiniStat value={list.countries.length.toString()} label="mercados" />
                    </div>

                    <div className="space-y-2 rounded-lg border border-gray-200 p-3">
                        <PreviewRow company="Empresa compradora" market={list.countries[0] || "Global"} email="co****@empresa.com" />
                        <PreviewRow company="Importador regional" market={list.countries[1] || "EU"} email="im****@empresa.com" />
                        <PreviewRow company="Distribuidor B2B" market={list.countries[2] || "LATAM"} email="bu****@empresa.com" />
                    </div>
                </div>
            ) : (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                    <Database className="mx-auto h-10 w-10 text-gray-400" />
                    <h2 className="mt-4 font-semibold text-gray-900">Nenhuma lista ativa por enquanto</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Os destaques aparecerão aqui assim que o catálogo receber bases publicadas.
                    </p>
                </div>
            )}

            <div className="mt-4 rounded-lg bg-gray-950 p-4 text-white">
                <div className="text-sm text-gray-300">Leads nas listas em destaque</div>
                <div className="mt-1 text-2xl font-bold">{previewLeadTotal.toLocaleString("pt-BR")}</div>
            </div>
        </div>
    )
}

function FeaturedListCard({ list }: { list: HomeList }) {
    const pricePerLead = list.totalLeads > 0 ? list.price / list.totalLeads : 0

    return (
        <Link
            href={`/list/${list.slug}`}
            className="group flex h-full flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
        >
            <div className="mb-4 flex items-start justify-between gap-4">
                <Badge variant="outline" className="rounded-md text-gray-600">
                    {list.category}
                </Badge>
                <CountryCluster countries={list.countries} />
            </div>

            <h3 className="line-clamp-2 text-lg font-semibold text-gray-950 transition-colors group-hover:text-emerald-700">
                {list.name}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                {list.description || "Base pronta para prospecção com empresas qualificadas."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                    <div className="font-semibold text-gray-950">{list.totalLeads.toLocaleString("pt-BR")}</div>
                    <div className="text-gray-500">empresas</div>
                </div>
                <div>
                    <div className="font-semibold text-gray-950">{list.countries.length}</div>
                    <div className="text-gray-500">mercados</div>
                </div>
            </div>

            {list.industries.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                    {list.industries.slice(0, 3).map((industry) => (
                        <Badge key={industry} variant="secondary" className="rounded-md text-xs">
                            {industry}
                        </Badge>
                    ))}
                </div>
            )}

            <div className="mt-auto flex items-end justify-between gap-4 border-t border-gray-100 pt-4">
                <div>
                    <div className="text-xl font-bold text-gray-950">
                        {formatCurrency(list.price, list.currency)}
                    </div>
                    <div className="text-xs text-gray-500">
                        {formatCurrency(pricePerLead, list.currency)} por lead
                    </div>
                </div>
                <ArrowRight className="h-5 w-5 text-emerald-600 transition-transform group-hover:translate-x-1" />
            </div>
        </Link>
    )
}

function TrustNote({
    icon: Icon,
    text,
}: {
    icon: React.ComponentType<{ className?: string }>
    text: string
}) {
    return (
        <span className="inline-flex items-center gap-2">
            <Icon className="h-4 w-4 text-emerald-600" />
            {text}
        </span>
    )
}

function MetricCard({
    icon: Icon,
    value,
    label,
}: {
    icon: React.ComponentType<{ className?: string }>
    value: string
    label: string
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <div className="text-xl font-bold text-gray-950">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
            </div>
        </div>
    )
}

function ProcessStep({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-gray-950">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-gray-600">{description}</p>
        </div>
    )
}

function ConfidenceItem({
    icon: Icon,
    text,
}: {
    icon: React.ComponentType<{ className?: string }>
    text: string
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-400/15 text-emerald-300">
                <Icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-100">{text}</span>
        </div>
    )
}

function CountryCluster({ countries }: { countries: string[] }) {
    return (
        <div className="flex items-center gap-1">
            {countries.slice(0, 3).map((country) => (
                <FlagIcon key={country} code={country} size="sm" className="shadow-sm" />
            ))}
            {countries.length > 3 && (
                <span className="ml-1 text-xs font-medium text-gray-500">+{countries.length - 3}</span>
            )}
        </div>
    )
}

function MiniStat({ value, label }: { value: string; label: string }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="truncate text-sm font-semibold text-gray-950">{value}</div>
            <div className="mt-1 text-xs text-gray-500">{label}</div>
        </div>
    )
}

function PreviewRow({
    company,
    market,
    email,
}: {
    company: string
    market: string
    email: string
}) {
    return (
        <div className="grid grid-cols-[1fr_64px_112px] items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs">
            <span className="truncate font-medium text-gray-800">{company}</span>
            <span className="truncate text-gray-500">{market}</span>
            <span className="truncate font-mono text-gray-500">{email}</span>
        </div>
    )
}
