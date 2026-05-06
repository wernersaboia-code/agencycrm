"use client"

import Link from "next/link"
import { useEffect } from "react"
import type { ComponentType } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/cart-context"
import { PayPalButtonsWrapper } from "@/components/checkout/paypal-buttons"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    FileDown,
    Lock,
    Shield,
    ShieldCheck,
    Users,
} from "lucide-react"

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
    const totalLeads = items.reduce((sum, item) => sum + item.totalLeads * item.quantity, 0)
    const paypalItems = items.map((item) => ({
        listId: item.id,
        quantity: item.quantity,
    }))

    return (
        <div className="min-h-screen bg-gray-50">
            <section className="border-b border-gray-200 bg-white">
                <div className="container mx-auto px-4 py-6">
                    <Link
                        href="/cart"
                        className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#4a2c5a]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar ao carrinho
                    </Link>
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-950">Checkout</h1>
                            <p className="mt-2 text-gray-500">
                                Finalize o pagamento para liberar {totalLeads.toLocaleString()} leads em CSV e Excel.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 text-center text-sm">
                            <CheckoutStep label="Carrinho" done />
                            <CheckoutStep label="Pagamento" active />
                            <CheckoutStep label="Download" />
                        </div>
                    </div>
                </div>
            </section>

            <div className="container mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1fr_340px]">
                <div className="space-y-6">
                    <Card className="border-gray-200">
                        <CardContent className="p-6">
                            <div className="mb-5 flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#2ec4b6]/10 text-[#1ba399]">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Pagamento seguro
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        O PayPal processa o pagamento; o sistema libera a compra automaticamente após a confirmação.
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                                <Lock className="mr-2 inline h-4 w-4" />
                                Você será redirecionado no próprio fluxo do PayPal para autorizar a transação.
                            </div>

                            <PayPalButtonsWrapper items={paypalItems} />
                        </CardContent>
                    </Card>

                    <div className="grid gap-3 md:grid-cols-3">
                        <TrustItem icon={ShieldCheck} title="Seguro" text="Pagamento externo via PayPal." />
                        <TrustItem icon={CheckCircle2} title="Registrado" text="Pedido salvo para acesso futuro." />
                        <TrustItem icon={FileDown} title="Imediato" text="Download liberado após aprovação." />
                    </div>
                </div>

                <aside>
                    <Card className="sticky top-24 border-gray-200">
                        <CardContent className="space-y-6 p-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Resumo</h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    {items.length} {items.length === 1 ? "lista" : "listas"} no pedido
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600">
                                            <Building2 className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
                                                {item.name}
                                            </h3>
                                            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                                <Users className="h-3 w-3" />
                                                {item.totalLeads.toLocaleString()} leads
                                            </div>
                                            <div className="mt-1 font-semibold text-[#4a2c5a]">
                                                {formatCurrency(item.price, item.currency)}
                                            </div>
                                        </div>
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
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    )
}

function CheckoutStep({
    label,
    active = false,
    done = false,
}: {
    label: string
    active?: boolean
    done?: boolean
}) {
    return (
        <div
            className={`rounded-md px-3 py-2 font-medium ${
                active
                    ? "bg-[#4a2c5a] text-white"
                    : done
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-500"
            }`}
        >
            {label}
        </div>
    )
}

function TrustItem({
    icon: Icon,
    title,
    text,
}: {
    icon: ComponentType<{ className?: string }>
    title: string
    text: string
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <Icon className="mb-3 h-5 w-5 text-[#2ec4b6]" />
            <div className="font-semibold text-gray-900">{title}</div>
            <p className="mt-1 text-sm text-gray-500">{text}</p>
        </div>
    )
}
