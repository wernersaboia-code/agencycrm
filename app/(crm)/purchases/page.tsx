// app/(crm)/purchases/page.tsx
import { Suspense } from "react"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getUserPurchases } from "@/actions/checkout"
import { PurchaseCard } from "@/components/purchases/purchase-card"
import { ShoppingBag, Download, Package } from "lucide-react"

export const metadata = {
    title: "Minhas Compras | LeadStore",
    description: "Acesse suas compras e baixe suas listas",
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

export default async function PurchasesPage() {
    const { session } = await getSession()

    if (!session) {
        redirect("/sign-in")
    }

    const purchases = await getUserPurchases()

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-[#4a2c5a] h-16 flex items-center px-6">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">L</span>
                    </div>
                    <span className="text-white font-bold text-xl">LeadStore</span>
                </div>
            </header>

            {/* Conteúdo */}
            <div className="max-w-6xl mx-auto p-6">
                {/* Título */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-[#4a2c5a] flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Minhas Compras</h1>
                    </div>
                    <p className="text-gray-500">
                        Acesse suas listas compradas e faça o download
                    </p>
                </div>

                {/* Lista de Compras */}
                {purchases.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">
                            Nenhuma compra ainda
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Explore nosso catálogo e encontre as listas perfeitas para seu negócio
                        </p>
                        <a
                            href="/catalog"
                            className="inline-flex items-center gap-2 bg-[#4a2c5a] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#5d3a70] transition-colors"
                        >
                            Ver Catálogo
                            <Download className="h-4 w-4" />
                        </a>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {purchases.map((purchase) => (
                            <Suspense
                                key={purchase.id}
                                fallback={<div className="h-32 bg-gray-100 rounded-2xl animate-pulse"/>}
                            >
                                <PurchaseCard purchase={purchase} />
                            </Suspense>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}