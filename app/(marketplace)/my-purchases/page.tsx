import Link from "next/link"
import { Suspense } from "react"
import type { ComponentType } from "react"
import { redirect } from "next/navigation"
import {
    AlertTriangle,
    ArrowLeft,
    Database,
    DollarSign,
    FileDown,
    KeyRound,
    Package,
    Rocket,
    ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getUserPurchases } from "@/actions/checkout"
import type { UserPurchase } from "@/actions/checkout"
import { PublicPurchaseCard } from "@/components/marketplace/public-purchase-card"
import { validatePurchaseAccessToken } from "@/lib/auth/magic-link"
import { getAuthenticatedUserId } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"

export const metadata = {
    title: "Minhas Compras | Easy Prospect",
    description: "Acesse e baixe suas listas de leads",
}

interface PageProps {
    searchParams: Promise<{ token?: string }>
}

async function PurchasesContent({ searchParams }: PageProps) {
    const { token } = await searchParams

    if (token) {
        const validation = await validatePurchaseAccessToken(token)

        if (!validation.valid) {
            return (
                <InvalidTokenState
                    message={
                        validation.error === "Token expirado"
                            ? "Este link expirou. Solicite um novo acesso na sua área de compras."
                            : "Este link não é válido ou já foi utilizado."
                    }
                />
            )
        }

        const purchases = await getUserPurchases()
        const filteredPurchases = validation.purchaseId
            ? purchases.filter((purchase) => purchase.id === validation.purchaseId)
            : purchases

        return (
            <PurchasesDashboard
                purchases={filteredPurchases}
                tokenNotice={validation.purchaseId ? "Acesso por link mágico válido por 24h." : undefined}
            />
        )
    }

    const userId = await getAuthenticatedUserId()

    if (!userId) {
        redirect("/sign-in?redirect=/my-purchases")
    }

    const purchases = await getUserPurchases()

    return <PurchasesDashboard purchases={purchases} />
}

function PurchasesDashboard({
    purchases,
    tokenNotice,
}: {
    purchases: UserPurchase[]
    tokenNotice?: string
}) {
    const stats = getPurchaseStats(purchases)
    const currency = purchases[0]?.currency || "EUR"

    return (
        <div className="min-h-screen bg-gray-50">
            <section className="border-b border-gray-200 bg-white">
                <div className="container mx-auto px-4 py-6">
                    <Button variant="ghost" className="mb-4 px-0 text-gray-600 hover:text-[#4a2c5a]" asChild>
                        <Link href="/catalog">
                            <ArrowLeft className="h-4 w-4" />
                            Voltar ao catálogo
                        </Link>
                    </Button>

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                                <FileDown className="h-4 w-4" />
                                Downloads e histórico de pedidos
                            </div>
                            <h1 className="text-3xl font-bold text-gray-950">Minhas compras</h1>
                            <p className="mt-2 max-w-2xl text-gray-500">
                                Baixe suas listas, confira o status dos pedidos e use os arquivos para alimentar suas campanhas no CRM.
                            </p>
                            {tokenNotice && (
                                <p className="mt-2 inline-flex items-center gap-2 text-sm text-amber-700">
                                    <KeyRound className="h-4 w-4" />
                                    {tokenNotice}
                                </p>
                            )}
                        </div>

                        {purchases.length > 0 && (
                            <Button className="bg-[#4a2c5a] hover:bg-[#5d3a70]" asChild>
                                <Link href="/dashboard">
                                    <Rocket className="h-4 w-4" />
                                    Abrir CRM
                                </Link>
                            </Button>
                        )}
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            label="Compras"
                            value={stats.totalPurchases.toString()}
                            icon={ShoppingBag}
                            tone="blue"
                        />
                        <StatCard
                            label="Listas"
                            value={stats.totalLists.toString()}
                            icon={Package}
                            tone="emerald"
                        />
                        <StatCard
                            label="Leads"
                            value={stats.totalLeads.toLocaleString()}
                            icon={Database}
                            tone="violet"
                        />
                        <StatCard
                            label="Investido"
                            value={formatCurrency(stats.totalSpent, currency)}
                            icon={DollarSign}
                            tone="amber"
                        />
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-8">
                {purchases.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
                        <div className="space-y-4">
                            {purchases.map((purchase) => (
                                <PublicPurchaseCard key={purchase.id} purchase={purchase} />
                            ))}
                        </div>

                        <aside className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Próximos passos
                            </h2>
                            <div className="mt-4 space-y-4">
                                <GuidanceItem
                                    icon={FileDown}
                                    title="Baixe em Excel"
                                    text="Use Excel quando precisar revisar colunas antes de importar."
                                />
                                <GuidanceItem
                                    icon={Database}
                                    title="Importe no CRM"
                                    text="Crie uma lista de trabalho e acompanhe abordagens por campanha."
                                />
                                <GuidanceItem
                                    icon={Rocket}
                                    title="Priorize por mercado"
                                    text="Comece pelos países e setores mais próximos da sua oferta."
                                />
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    )
}

function getPurchaseStats(purchases: UserPurchase[]) {
    return purchases.reduce(
        (stats, purchase) => {
            stats.totalPurchases += 1
            stats.totalLists += purchase.items.length
            stats.totalLeads += purchase.items.reduce((sum, item) => sum + item.list.totalLeads, 0)
            stats.totalSpent += purchase.total
            return stats
        },
        {
            totalPurchases: 0,
            totalLists: 0,
            totalLeads: 0,
            totalSpent: 0,
        }
    )
}

function EmptyState() {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-md bg-gray-100">
                <ShoppingBag className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Nenhuma compra ainda
            </h2>
            <p className="mx-auto mb-7 max-w-md text-sm text-gray-500">
                Explore o catálogo, selecione uma base compatível com sua campanha e volte aqui para baixar os arquivos.
            </p>
            <Button className="bg-[#4a2c5a] hover:bg-[#5d3a70]" asChild>
                <Link href="/catalog">
                    Explorar catálogo
                </Link>
            </Button>
        </div>
    )
}

function InvalidTokenState({ message }: { message: string }) {
    return (
        <div className="min-h-[70vh] bg-gray-50 px-4 py-16">
            <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-md bg-red-100">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">
                    Link inválido ou expirado
                </h2>
                <p className="mb-6 text-sm text-gray-500">{message}</p>
                <Button className="bg-[#4a2c5a] hover:bg-[#5d3a70]" asChild>
                    <Link href="/catalog">
                        Ir para o catálogo
                    </Link>
                </Button>
            </div>
        </div>
    )
}

function StatCard({
    label,
    value,
    icon: Icon,
    tone,
}: {
    label: string
    value: string
    icon: ComponentType<{ className?: string }>
    tone: "blue" | "emerald" | "violet" | "amber"
}) {
    const tones = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        violet: "bg-violet-50 text-violet-600",
        amber: "bg-amber-50 text-amber-600",
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-md ${tones[tone]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <div className="truncate text-xl font-bold text-gray-950">{value}</div>
                    <div className="text-sm text-gray-500">{label}</div>
                </div>
            </div>
        </div>
    )
}

function GuidanceItem({
    icon: Icon,
    title,
    text,
}: {
    icon: ComponentType<{ className?: string }>
    title: string
    text: string
}) {
    return (
        <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#2ec4b6]/10 text-[#1ba399]">
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <div className="font-medium text-gray-900">{title}</div>
                <p className="mt-1 text-sm text-gray-500">{text}</p>
            </div>
        </div>
    )
}

export default function MyPurchasesPage({ searchParams }: PageProps) {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gray-50 px-4 py-16">
                    <div className="mx-auto max-w-md text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-[#4a2c5a]/10">
                            <ShoppingBag className="h-7 w-7 animate-pulse text-[#4a2c5a]" />
                        </div>
                        <p className="text-gray-500">Carregando suas compras...</p>
                    </div>
                </div>
            }
        >
            <PurchasesContent searchParams={searchParams} />
        </Suspense>
    )
}
