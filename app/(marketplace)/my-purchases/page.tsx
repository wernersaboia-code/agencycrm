// app/(marketplace)/my-purchases/page.tsx.bak
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { ShoppingBag, Package, Database, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getUserPurchases } from "@/actions/checkout"
import { PublicPurchaseCard } from "@/components/marketplace/public-purchase-card"
import { validatePurchaseAccessToken } from "@/lib/auth/magic-link"

export const metadata = {
    title: "Minhas Compras | Easy Prospect",
    description: "Acesse e baixe suas listas de leads",
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
                setAll() {
                    // Em Server Components, não podemos setar cookies
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()
    return { session }
}

interface PageProps {
    searchParams: Promise<{ token?: string }>
}

async function PurchasesContent({ searchParams }: PageProps) {
    const { token } = await searchParams

    // 🆕 Verificar se acesso é via token mágico
    if (token) {
        const validation = await validatePurchaseAccessToken(token)

        if (!validation.valid) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 max-w-md">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            Link Inválido ou Expirado
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {validation.error === "Token expirado"
                                ? "Este link expirou. Solicite um novo na sua área de compras."
                                : "Este link não é válido ou já foi utilizado."}
                        </p>
                        <Button
                            className="bg-[#4a2c5a] hover:bg-[#5d3a70]"
                            asChild
                        >
                            <Link href="/catalog">
                                Ir para o Catálogo
                            </Link>
                        </Button>
                    </div>
                </div>
            )
        }

        // Token válido - buscar compras do usuário
        const purchases = await getUserPurchases()

        // Filtrar apenas a compra específica se o token for para uma compra
        const filteredPurchases = validation.purchaseId
            ? purchases.filter(p => p.id === validation.purchaseId)
            : purchases

        // Type para os items
        type PurchaseItem = {
            list: {
                totalLeads: number
            }
        }

        // Calcular stats
        const totalPurchases = filteredPurchases.length
        const totalLists = filteredPurchases.reduce((sum, p) => sum + p.items.length, 0)
        const totalLeads = filteredPurchases.reduce(
            (sum, p) => sum + p.items.reduce((s: number, i: PurchaseItem) => s + i.list.totalLeads, 0),
            0
        )
        const totalSpent = filteredPurchases.reduce((sum, p) => sum + p.total, 0)

        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#4a2c5a] to-[#5d3a70] text-white">
                    <div className="container mx-auto px-4 py-12">
                        {/* Voltar */}
                        <Button
                            variant="ghost"
                            className="text-white hover:bg-white/10 mb-6"
                            asChild
                        >
                            <Link href="/catalog">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Voltar ao Catálogo
                            </Link>
                        </Button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                <ShoppingBag className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Minhas Compras</h1>
                                <p className="text-white/80">
                                    Acesse e baixe suas listas de leads
                                </p>
                                {validation.purchaseId && (
                                    <p className="text-white/60 text-sm mt-1">
                                        Acesso via link mágico - Válido por 24h
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShoppingBag className="h-5 w-5 text-[#2ec4b6]" />
                                    <span className="text-sm text-white/70">Total Compras</span>
                                </div>
                                <div className="text-2xl font-bold">{totalPurchases}</div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Package className="h-5 w-5 text-[#2ec4b6]" />
                                    <span className="text-sm text-white/70">Listas</span>
                                </div>
                                <div className="text-2xl font-bold">{totalLists}</div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Database className="h-5 w-5 text-[#2ec4b6]" />
                                    <span className="text-sm text-white/70">Total Leads</span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {totalLeads.toLocaleString()}
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">💰</span>
                                    <span className="text-sm text-white/70">Investido</span>
                                </div>
                                <div className="text-2xl font-bold">
                                    €{totalSpent.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lista de Compras */}
                <div className="container mx-auto px-4 py-8">
                    {filteredPurchases.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                                <ShoppingBag className="h-10 w-10 text-gray-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                Nenhuma compra ainda
                            </h2>
                            <p className="text-gray-500 mb-8">
                                Explore nosso catálogo e encontre as melhores listas de leads
                            </p>
                            <Button
                                className="bg-[#4a2c5a] hover:bg-[#5d3a70]"
                                asChild
                            >
                                <Link href="/catalog">
                                    Explorar Catálogo
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredPurchases.map((purchase) => (
                                <PublicPurchaseCard
                                    key={purchase.id}
                                    purchase={purchase}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // 🆕 Se não tem token, verificar sessão normal
    const { session } = await getSession()

    if (!session) {
        redirect("/sign-in?redirect=/my-purchases")
    }

    const purchases = await getUserPurchases()

    // Type para os items
    type PurchaseItem = {
        list: {
            totalLeads: number
        }
    }

    // Calcular stats
    const totalPurchases = purchases.length
    const totalLists = purchases.reduce((sum, p) => sum + p.items.length, 0)
    const totalLeads = purchases.reduce(
        (sum, p) => sum + p.items.reduce((s: number, i: PurchaseItem) => s + i.list.totalLeads, 0),
        0
    )
    const totalSpent = purchases.reduce((sum, p) => sum + p.total, 0)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#4a2c5a] to-[#5d3a70] text-white">
                <div className="container mx-auto px-4 py-12">
                    {/* Voltar */}
                    <Button
                        variant="ghost"
                        className="text-white hover:bg-white/10 mb-6"
                        asChild
                    >
                        <Link href="/catalog">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar ao Catálogo
                        </Link>
                    </Button>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Minhas Compras</h1>
                            <p className="text-white/80">
                                Acesse e baixe suas listas de leads
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <ShoppingBag className="h-5 w-5 text-[#2ec4b6]" />
                                <span className="text-sm text-white/70">Total Compras</span>
                            </div>
                            <div className="text-2xl font-bold">{totalPurchases}</div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Package className="h-5 w-5 text-[#2ec4b6]" />
                                <span className="text-sm text-white/70">Listas</span>
                            </div>
                            <div className="text-2xl font-bold">{totalLists}</div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Database className="h-5 w-5 text-[#2ec4b6]" />
                                <span className="text-sm text-white/70">Total Leads</span>
                            </div>
                            <div className="text-2xl font-bold">
                                {totalLeads.toLocaleString()}
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">💰</span>
                                <span className="text-sm text-white/70">Investido</span>
                            </div>
                            <div className="text-2xl font-bold">
                                €{totalSpent.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Compras */}
            <div className="container mx-auto px-4 py-8">
                {purchases.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="h-10 w-10 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Nenhuma compra ainda
                        </h2>
                        <p className="text-gray-500 mb-8">
                            Explore nosso catálogo e encontre as melhores listas de leads
                        </p>
                        <Button
                            className="bg-[#4a2c5a] hover:bg-[#5d3a70]"
                            asChild
                        >
                            <Link href="/catalog">
                                Explorar Catálogo
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {purchases.map((purchase) => (
                            <PublicPurchaseCard
                                key={purchase.id}
                                purchase={purchase}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* CTA para CRM (opcional) */}
            {purchases.length > 0 && (
                <div className="container mx-auto px-4 pb-12">
                    <div className="bg-gradient-to-br from-[#2ec4b6] to-[#1ba399] rounded-2xl p-8 text-white text-center">
                        <h3 className="text-2xl font-bold mb-2">
                            Quer fazer mais com seus leads?
                        </h3>
                        <p className="text-white/90 mb-6">
                            Use nosso CRM gratuito para gerenciar campanhas, enviar emails e fazer ligações
                        </p>
                        <Button
                            size="lg"
                            className="bg-white text-[#2ec4b6] hover:bg-white/90"
                            asChild
                        >
                            <Link href="/dashboard">
                                Acessar CRM Grátis
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function MyPurchasesPage({ searchParams }: PageProps) {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-[#4a2c5a]/10 flex items-center justify-center mx-auto mb-4">
                            <ShoppingBag className="h-8 w-8 text-[#4a2c5a] animate-pulse" />
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