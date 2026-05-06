"use client"

import Link from "next/link"
import type { ComponentType } from "react"
import { useCart } from "@/contexts/cart-context"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    CheckCircle2,
    FileDown,
    ShieldCheck,
    ShoppingBag,
    Trash2,
    Users,
} from "lucide-react"

export default function CartPage() {
    const { items, removeItem, total, clearCart, itemCount } = useCart()
    const totalLeads = items.reduce((sum, item) => sum + item.totalLeads * item.quantity, 0)
    const currency = items[0]?.currency || "EUR"

    if (items.length === 0) {
        return (
            <div className="min-h-[70vh] bg-gray-50 px-4 py-16">
                <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-gray-100">
                        <ShoppingBag className="h-8 w-8 text-gray-400" />
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-gray-900">
                        Seu carrinho está vazio
                    </h1>
                    <p className="mb-6 text-sm text-gray-500">
                        Escolha uma lista no catálogo para revisar preço, cobertura e formato antes de finalizar a compra.
                    </p>
                    <Button asChild size="lg" className="bg-[#4a2c5a] hover:bg-[#5d3a70]">
                        <Link href="/catalog">
                            <ArrowLeft className="h-4 w-4" />
                            Ver catálogo
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <section className="border-b border-gray-200 bg-white">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <Link
                                href="/catalog"
                                className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4a2c5a]"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Continuar comprando
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-950">
                                Revisar carrinho
                            </h1>
                            <p className="mt-2 text-gray-500">
                                {itemCount} {itemCount === 1 ? "lista selecionada" : "listas selecionadas"} com {totalLeads.toLocaleString()} leads no total.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 text-center text-sm">
                            <CheckoutStep label="Carrinho" active />
                            <CheckoutStep label="Pagamento" />
                            <CheckoutStep label="Download" />
                        </div>
                    </div>
                </div>
            </section>

            <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_360px]">
                <div className="space-y-4">
                    {items.map((item) => (
                        <Card key={item.id} className="overflow-hidden border-gray-200">
                            <CardContent className="p-5">
                                <div className="flex flex-col gap-5 sm:flex-row">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600">
                                        <Building2 className="h-8 w-8 text-white" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <Link
                                                    href={`/list/${item.slug}`}
                                                    className="block text-lg font-semibold text-gray-900 transition-colors hover:text-[#2ec4b6]"
                                                >
                                                    {item.name}
                                                </Link>
                                                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-4 w-4" />
                                                        {item.totalLeads.toLocaleString()} leads
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <FileDown className="h-4 w-4" />
                                                        CSV e Excel
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-left md:text-right">
                                                <div className="text-2xl font-bold text-[#4a2c5a]">
                                                    {formatCurrency(item.price, item.currency)}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeItem(item.id)}
                                                    className="mt-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Remover
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearCart}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <Trash2 className="h-4 w-4" />
                        Limpar carrinho
                    </Button>
                </div>

                <aside>
                    <Card className="sticky top-24 border-gray-200">
                        <CardContent className="space-y-6 p-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Resumo do pedido</h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Confira os itens antes de abrir o pagamento.
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between gap-3 text-sm">
                                        <span className="truncate text-gray-600">{item.name}</span>
                                        <span className="shrink-0 font-semibold text-gray-900">
                                            {formatCurrency(item.price, item.currency)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Total de leads</span>
                                    <span>{totalLeads.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-xl font-bold">
                                    <span className="text-gray-900">Total</span>
                                    <span className="text-[#4a2c5a]">{formatCurrency(total, currency)}</span>
                                </div>
                            </div>

                            <Button
                                className="h-12 w-full bg-[#4a2c5a] text-base hover:bg-[#3a1c4a]"
                                size="lg"
                                asChild
                            >
                                <Link href="/checkout">
                                    Finalizar compra
                                    <ArrowRight className="h-5 w-5" />
                                </Link>
                            </Button>

                            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <TrustItem icon={ShieldCheck} text="Pagamento processado pelo PayPal" />
                                <TrustItem icon={CheckCircle2} text="Pedido salvo na sua conta" />
                                <TrustItem icon={FileDown} text="Download liberado após confirmação" />
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    )
}

function CheckoutStep({ label, active = false }: { label: string; active?: boolean }) {
    return (
        <div
            className={`rounded-md px-3 py-2 font-medium ${
                active ? "bg-[#4a2c5a] text-white" : "text-gray-500"
            }`}
        >
            {label}
        </div>
    )
}

function TrustItem({
    icon: Icon,
    text,
}: {
    icon: ComponentType<{ className?: string }>
    text: string
}) {
    return (
        <div className="flex items-start gap-2 text-sm text-gray-600">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#2ec4b6]" />
            {text}
        </div>
    )
}
