"use client"

import type { ComponentType } from "react"
import { Link } from "@/lib/i18n/navigation"
import { useFormatter, useTranslations } from "next-intl"
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
    HelpCircle,
    ShieldCheck,
    ShoppingBag,
    Trash2,
    Users,
} from "lucide-react"

export default function CartPage() {
    const { items, removeItem, total, clearCart, itemCount } = useCart()
    const t = useTranslations("cart")
    const tCheckout = useTranslations("checkout")
    const format = useFormatter()
    const totalLeads = items.reduce((sum, item) => sum + item.totalLeads * item.quantity, 0)
    const currency = items[0]?.currency || "EUR"

    if (items.length === 0) {
        return (
            <div className="min-h-[70vh] bg-muted/40 px-4 py-16">
                <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-foreground">{t("empty")}</h1>
                    <p className="mb-6 text-sm text-muted-foreground">{t("emptyDesc")}</p>
                    <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand-hover">
                        <Link href="/catalog">
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            {t("seeCatalog")}
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/40">
            <section className="border-b bg-card">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <Link
                                href="/catalog"
                                className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
                            >
                                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                                {t("continue")}
                            </Link>
                            <h1 className="text-3xl font-bold text-foreground">{t("pageTitle")}</h1>
                            <p className="mt-2 text-muted-foreground">
                                {t("pageSubtitle", { count: itemCount, leads: format.number(totalLeads) })}
                            </p>
                        </div>

                        <ol className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-2 text-center text-sm">
                            <CheckoutStep label={tCheckout("stepCart")} active />
                            <CheckoutStep label={tCheckout("stepPayment")} />
                            <CheckoutStep label={tCheckout("stepDownload")} />
                        </ol>
                    </div>
                </div>
            </section>

            <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_360px]">
                <div className="space-y-4">
                    {items.map((item) => (
                        <Card key={item.id} className="overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex flex-col gap-5 sm:flex-row">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-blue-600">
                                        <Building2 className="h-8 w-8 text-white" aria-hidden="true" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <Link
                                                    href={`/list/${item.slug}`}
                                                    className="block text-lg font-semibold text-foreground transition-colors hover:text-brand"
                                                >
                                                    {item.name}
                                                </Link>
                                                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-4 w-4" aria-hidden="true" />
                                                        {t("leads", { count: format.number(item.totalLeads) })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <FileDown className="h-4 w-4" aria-hidden="true" />
                                                        {t("formats")}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-left md:text-right">
                                                <div className="text-2xl font-bold text-brand">
                                                    {formatCurrency(item.price, item.currency)}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeItem(item.id)}
                                                    aria-label={t("removeItem", { name: item.name })}
                                                    className="mt-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                    {t("remove")}
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
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        {t("clear")}
                    </Button>
                </div>

                <aside>
                    <Card className="sticky top-24">
                        <CardContent className="space-y-6 p-6">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">{t("summaryTitle")}</h2>
                                <p className="mt-1 text-sm text-muted-foreground">{t("summarySubtitle")}</p>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between gap-3 text-sm">
                                        <span className="truncate text-muted-foreground">{item.name}</span>
                                        <span className="shrink-0 font-semibold text-foreground">
                                            {formatCurrency(item.price, item.currency)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>{t("totalLeads")}</span>
                                    <span>{format.number(totalLeads)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xl font-bold">
                                    <span className="text-foreground">{t("total")}</span>
                                    <span className="text-brand">{formatCurrency(total, currency)}</span>
                                </div>
                            </div>

                            <Button
                                className="h-12 w-full bg-brand text-base text-brand-foreground hover:bg-brand-hover"
                                size="lg"
                                asChild
                            >
                                <Link href="/checkout">
                                    {t("checkout")}
                                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                                </Link>
                            </Button>

                            <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                                <TrustItem icon={ShieldCheck} text={t("trustPaypal")} />
                                <TrustItem icon={CheckCircle2} text={t("trustSaved")} />
                                <TrustItem icon={FileDown} text={t("trustDownload")} />
                                <TrustItem icon={HelpCircle} text={t("trustReview")} />
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
        <li
            aria-current={active ? "step" : undefined}
            className={`list-none rounded-md px-3 py-2 font-medium ${
                active ? "bg-brand text-brand-foreground" : "text-muted-foreground"
            }`}
        >
            {label}
        </li>
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
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent-strong" />
            {text}
        </div>
    )
}
