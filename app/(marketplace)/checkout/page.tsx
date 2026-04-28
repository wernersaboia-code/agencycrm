// app/(marketplace)/checkout/page.tsx.bak
"use client"

import { useCart } from "@/contexts/cart-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { PayPalButtonsWrapper } from "@/components/checkout/paypal-buttons"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Lock, Shield, Building2, Users } from "lucide-react"
import Link from "next/link"

export default function CheckoutPage() {
    const { items, total } = useCart()
    const router = useRouter()

    useEffect(() => {
        if (items.length === 0) {
            router.push("/catalog")
        }
    }, [items, router])

    if (items.length === 0) {
        return null
    }

    const currency = items[0]?.currency || "EUR"
    const paypalItems = items.map((item) => ({
        listId: item.id,
        quantity: item.quantity,
    }))

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-[#4a2c5a] h-16 flex items-center px-6">
                <Link
                    href="/cart"
                    className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-semibold">Voltar ao Carrinho</span>
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
                    {/* Coluna Principal - Pagamento */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-[#2ec4b6]" />
                                    Pagamento Seguro
                                </h2>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-blue-800">
                                        <Lock className="h-4 w-4 inline mr-2" />
                                        Seu pagamento é processado de forma 100% segura pelo PayPal
                                    </p>
                                </div>

                                {/* PayPal Buttons */}
                                <PayPalButtonsWrapper items={paypalItems} />

                                <p className="text-xs text-center text-gray-500 mt-4">
                                    Ao clicar em &ldquo;Pagar com PayPal&rdquo;, você será redirecionado para
                                    concluir o pagamento de forma segura
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Resumo */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-6">
                            <CardContent className="p-6 space-y-6">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Resumo do Pedido
                                </h2>

                                <Separator />

                                {/* Items */}
                                <div className="space-y-4">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                                <Building2 className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-sm text-gray-800 line-clamp-2">
                                                    {item.name}
                                                </h3>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                    <Users className="h-3 w-3" />
                                                    {item.totalLeads.toLocaleString()} leads
                                                </div>
                                                <div className="font-semibold text-[#4a2c5a] mt-1">
                                                    {formatCurrency(item.price, item.currency)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator />

                                {/* Total */}
                                <div className="flex justify-between items-center text-xl font-bold">
                                    <span className="text-gray-800">Total</span>
                                    <span className="text-[#4a2c5a]">
                    {formatCurrency(total, currency)}
                  </span>
                                </div>

                                {/* Benefícios */}
                                <div className="pt-4 border-t space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="w-2 h-2 rounded-full bg-[#2ec4b6]" />
                                        Acesso imediato após pagamento
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="w-2 h-2 rounded-full bg-[#2ec4b6]" />
                                        Download ilimitado
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="w-2 h-2 rounded-full bg-[#2ec4b6]" />
                                        Suporte dedicado
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
