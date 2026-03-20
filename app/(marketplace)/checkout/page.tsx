// app/(marketplace)/checkout/page.tsx
import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { CheckoutSummary } from "@/components/checkout/checkout-summary"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { PayPalButtonPlaceholder } from "@/components/checkout/paypal-button-placeholder"
import { ArrowLeft, Lock, Shield } from "lucide-react"
import Link from "next/link"

interface CheckoutPageProps {
    searchParams: Promise<{ listId?: string }>
}

export const metadata = {
    title: "Checkout | LeadStore",
    description: "Finalize sua compra de forma segura",
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

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
    const { listId } = await searchParams
    const { session } = await getSession()

    // Redirecionar se não estiver logado
    if (!session) {
        redirect(`/sign-in?redirect=/checkout${listId ? `?listId=${listId}` : ''}`)
    }

    const userId = session.user.id

    // Buscar lista se listId fornecido
    let list = null
    if (listId) {
        list = await prisma.leadList.findUnique({
            where: { id: listId, isActive: true }
        })
    }

    if (listId && !list) {
        redirect("/catalog")
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-[#4a2c5a] h-16 flex items-center px-6">
                <Link
                    href="/catalog"
                    className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-semibold">Voltar</span>
                </Link>
            </header>

            {/* Conteúdo */}
            <div className="max-w-5xl mx-auto p-6">
                {/* Título */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Checkout</h1>
                    <p className="text-gray-500">Finalize sua compra de forma segura</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Coluna Principal - Formulário */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Dados do Usuário */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Lock className="h-5 w-5 text-[#2ec4b6]" />
                                Dados da Conta
                            </h2>
                            <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse"/>}>
                                <CheckoutForm userId={userId} />
                            </Suspense>
                        </div>

                        {/* Pagamento */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-[#2ec4b6]" />
                                Pagamento
                            </h2>

                            {/* Placeholder PayPal */}
                            <PayPalButtonPlaceholder
                                listId={listId}
                                total={list ? Number(list.price) : 0}
                                currency={list?.currency || "EUR"}
                            />

                            <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-2">
                                <Lock className="h-3 w-3" />
                                Pagamento processado de forma segura pelo PayPal
                            </p>
                        </div>
                    </div>

                    {/* Sidebar - Resumo */}
                    <div className="lg:col-span-1">
                        <Suspense fallback={<div className="h-64 bg-gray-100 rounded-2xl animate-pulse"/>}>
                            <CheckoutSummary list={list} />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    )
}