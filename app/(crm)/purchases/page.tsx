// app/(crm)/purchases/page.tsx.bak
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getUserPurchases } from "@/actions/checkout"
import { PurchaseCard } from "@/components/purchases/purchase-card"
import { ShoppingBag, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
    title: "Minhas Compras | LeadStore",
    description: "Acesse suas listas de leads compradas",
}

async function getSession() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll() {},
            },
        }
    )

    const {
        data: { session },
    } = await supabase.auth.getSession()

    return { session }
}

export default async function PurchasesPage() {
    const { session } = await getSession()

    if (!session) {
        redirect("/sign-in?redirect=/purchases")
    }

    const purchases = await getUserPurchases()

    // Calcular totais
    const totalPurchases = purchases.length
    const totalLists = purchases.reduce((acc, p) => acc + p.items.length, 0)
    const totalLeads = purchases.reduce(
        (acc, p) =>
            acc +
            p.items.reduce(
                (sum: number, item: any) => sum + item.list.totalLeads,
                0
            ),
        0
    )

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/catalog">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <ShoppingBag className="h-6 w-6 text-[#2ec4b6]" />
                                    Minhas Compras
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Acesse e baixe suas listas de leads
                                </p>
                            </div>
                        </div>

                        <Button asChild className="bg-[#4a2c5a] hover:bg-[#5d3a70]">
                            <Link href="/catalog">
                                <Sparkles className="h-4 w-4 mr-2" />
                                Comprar Mais Listas
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <Suspense fallback={<PurchasesSkeleton />}>
                    {purchases.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="space-y-4">
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <StatCard
                                    label="Total de Compras"
                                    value={totalPurchases.toString()}
                                    icon={ShoppingBag}
                                    color="bg-blue-500"
                                />
                                <StatCard
                                    label="Total de Listas"
                                    value={totalLists.toString()}
                                    icon={ShoppingBag}
                                    color="bg-emerald-500"
                                />
                                <StatCard
                                    label="Total de Leads"
                                    value={totalLeads.toLocaleString()}
                                    icon={ShoppingBag}
                                    color="bg-purple-500"
                                />
                            </div>

                            {/* Purchases List */}
                            <div className="space-y-4">
                                {purchases.map((purchase) => (
                                    <PurchaseCard key={purchase.id} purchase={purchase} />
                                ))}
                            </div>
                        </div>
                    )}
                </Suspense>
            </div>
        </div>
    )
}

// Empty State
function EmptyState() {
    return (
        <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Nenhuma compra ainda
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Explore nosso catálogo e encontre as melhores listas de leads para
                impulsionar seu negócio
            </p>
            <Button asChild size="lg" className="bg-[#4a2c5a] hover:bg-[#5d3a70]">
                <Link href="/catalog">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Explorar Catálogo
                </Link>
            </Button>
        </div>
    )
}

// Stat Card
function StatCard({
                      label,
                      value,
                      icon: Icon,
                      color,
                  }: {
    label: string
    value: string
    icon: React.ComponentType<{ className?: string }>
    color: string
}) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                    <div className="text-2xl font-bold text-gray-800">{value}</div>
                    <div className="text-sm text-gray-500">{label}</div>
                </div>
            </div>
        </div>
    )
}

// Skeleton
function PurchasesSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className="h-32 bg-gray-100 rounded-2xl animate-pulse"
                />
            ))}
        </div>
    )
}