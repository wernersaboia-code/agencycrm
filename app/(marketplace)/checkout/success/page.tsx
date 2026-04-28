// app/(marketplace)/checkout/success/page.tsx.bak
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { CheckCircle, Download, ArrowRight, Mail, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

interface SuccessPageProps {
    searchParams: Promise<{ purchaseId?: string }>
}

type PurchaseItemWithList = Prisma.PurchaseItemGetPayload<{
    include: {
        list: true
    }
}>

export const metadata = {
    title: "Compra Confirmada | LeadStore",
    description: "Sua compra foi confirmada com sucesso",
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

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
    const { purchaseId } = await searchParams
    const { session } = await getSession()

    if (!session) {
        redirect("/sign-in")
    }

    const userId = session.user.id

    if (!purchaseId) {
        redirect("/catalog")
    }

    // Buscar compra
    const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId, userId },
        include: {
            items: {
                include: {
                    list: true
                }
            }
        }
    })

    if (!purchase) {
        redirect("/catalog")
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                {/* Card de Sucesso */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                    {/* Ícone de Sucesso */}
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-emerald-600" />
                    </div>

                    {/* Título */}
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Compra Confirmada!
                    </h1>
                    <p className="text-gray-500 mb-8">
                        Obrigado pela sua compra. Você já pode acessar suas listas.
                    </p>

                    {/* Resumo */}
                    <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                            <span className="text-sm text-gray-500">Número do Pedido</span>
                            <span className="font-mono text-sm font-medium">{purchase.id.slice(0, 8)}...</span>
                        </div>

                        <div className="space-y-3 mb-4">
                            {purchase.items.map((item: PurchaseItemWithList) => (
                                <div key={item.id} className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium text-gray-800 text-sm">
                                            {item.list.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {item.list.totalLeads.toLocaleString()} leads
                                        </div>
                                    </div>
                                    <span className="font-medium text-gray-800">
                                        {formatCurrency(Number(item.price), purchase.currency)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <hr className="border-gray-200 mb-4" />

                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-800">Total Pago</span>
                            <span className="text-xl font-bold text-[#4a2c5a]">
                                {formatCurrency(Number(purchase.total), purchase.currency)}
                            </span>
                        </div>
                    </div>

                    {/* Ações */}
                    <div className="space-y-3">
                        <Button className="w-full h-12 bg-[#4a2c5a] hover:bg-[#5d3a70]" asChild>
                            <Link href="/my-purchases">
                                <ShoppingBag className="h-5 w-5 mr-2" />
                                Acessar Minhas Compras
                            </Link>
                        </Button>

                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="h-12" asChild>
                                <Link href="/dashboard">
                                    <Download className="h-5 w-5 mr-2" />
                                    Usar CRM
                                </Link>
                            </Button>

                            <Button variant="outline" className="h-12" asChild>
                                <Link href="/catalog">
                                    Continuar Comprando
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Email de Confirmação */}
                    <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Mail className="h-4 w-4" />
                        Enviamos um email de confirmação para seu cadastro
                    </div>
                </div>
            </div>
        </div>
    )
}
