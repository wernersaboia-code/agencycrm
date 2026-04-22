// app/(marketplace)/cart/page.tsx.bak
"use client"

import { useCart } from "@/contexts/cart-context"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ShoppingBag, ArrowLeft, ArrowRight, Trash2, Building2, Users } from "lucide-react"
import Link from "next/link"

export default function CartPage() {
    const { items, removeItem, total, clearCart, itemCount } = useCart()

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="h-12 w-12 text-gray-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Seu carrinho está vazio
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        Explore nosso catálogo e encontre as melhores listas de leads
                    </p>
                    <Button asChild size="lg">
                        <Link href="/catalog">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Ver Catálogo
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Carrinho de Compras
                    </h1>
                    <p className="text-muted-foreground">
                        {itemCount} {itemCount === 1 ? "item" : "itens"} no carrinho
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/catalog">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Continuar Comprando
                    </Link>
                </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Items */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex gap-6">
                                    {/* Icon */}
                                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                        <Building2 className="h-10 w-10 text-white" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/list/${item.slug}`}
                                            className="font-semibold text-lg text-gray-800 hover:text-[#2ec4b6] transition-colors block mb-2"
                                        >
                                            {item.name}
                                        </Link>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                            <Users className="h-4 w-4" />
                                            <span>{item.totalLeads.toLocaleString()} leads incluídos</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-2xl font-bold text-[#4a2c5a]">
                                                {formatCurrency(item.price, item.currency)}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeItem(item.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Remover
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Clear Cart */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpar Carrinho
                    </Button>
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                        <CardContent className="p-6 space-y-6">
                            <h2 className="text-xl font-bold text-gray-800">Resumo do Pedido</h2>

                            <Separator />

                            {/* Items Summary */}
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-gray-600 truncate pr-2">{item.name}</span>
                                        <span className="font-semibold text-gray-800">
                      {formatCurrency(item.price, item.currency)}
                    </span>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            {/* Total */}
                            <div className="flex justify-between items-center text-xl font-bold">
                                <span className="text-gray-800">Total</span>
                                <span className="text-[#4a2c5a]">
                  {formatCurrency(total, items[0]?.currency || "EUR")}
                </span>
                            </div>

                            {/* Checkout Button */}
                            <Button
                                className="w-full h-12 text-base bg-[#4a2c5a] hover:bg-[#3a1c4a]"
                                size="lg"
                                asChild
                            >
                                <Link href="/checkout">
                                    Finalizar Compra
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                </Link>
                            </Button>

                            {/* Security */}
                            <div className="pt-4 border-t space-y-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="w-2 h-2 rounded-full bg-[#2ec4b6]" />
                                    Pagamento 100% seguro
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="w-2 h-2 rounded-full bg-[#2ec4b6]" />
                                    Acesso imediato após pagamento
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
    )
}