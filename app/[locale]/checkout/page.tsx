"use client"

import { useEffect } from "react"
import type { ComponentType } from "react"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { Link, useRouter } from "@/lib/i18n/navigation"
import { useCart } from "@/contexts/cart-context"
import { PayPalButtonsWrapper } from "@/components/checkout/paypal-buttons"
import { StripeCheckoutButton } from "@/components/checkout/stripe-checkout-button"
import {
    getOptionalPublicPaypalClientId,
    getOptionalPublicStripePublishableKey,
} from "@/lib/env"
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
    const { items, total, currency } = useCart()
    const router = useRouter()
    const t = useTranslations("checkout")
    const format = useFormatter()
    const locale = useLocale()

    // Cada botão de pagamento se esconde sozinho quando seu provedor não está
    // configurado. Isso deixava um caso sem dono: com nenhum configurado, o
    // cartão de pagamento ficava vazio e o comprador não tinha como saber se a
    // culpa era dele. Só esta página enxerga os dois provedores, então é aqui
    // que o aviso mora.
    const hasAnyPaymentProvider =
        Boolean(getOptionalPublicStripePublishableKey()) ||
        Boolean(getOptionalPublicPaypalClientId())

    useEffect(() => {
        if (items.length === 0) {
            router.push("/catalog")
        }
    }, [items, router])

    if (items.length === 0) {
        return null
    }

    const totalLeads = items.reduce((sum, item) => sum + item.totalLeads * item.quantity, 0)
    const paypalItems = items.map((item) => ({
        listId: item.id,
        quantity: item.quantity,
    }))

    return (
        <div className="min-h-screen bg-muted/40">
            <section className="border-b bg-card">
                <div className="container mx-auto px-4 py-6">
                    <Link
                        href="/cart"
                        className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        {t("backToCart")}
                    </Link>
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
                            <p className="mt-2 text-muted-foreground">
                                {t("subtitle", { count: format.number(totalLeads) })}
                            </p>
                        </div>

                        <ol className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-2 text-center text-sm">
                            <CheckoutStep label={t("stepCart")} done />
                            <CheckoutStep label={t("stepPayment")} active />
                            <CheckoutStep label={t("stepDownload")} />
                        </ol>
                    </div>
                </div>
            </section>

            <div className="container mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1fr_340px]">
                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="mb-5 flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-accent/15 text-brand-accent-strong">
                                    <Shield className="h-5 w-5" aria-hidden="true" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">{t("secureTitle")}</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">{t("secureDesc")}</p>
                                </div>
                            </div>

                            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
                                <Lock className="mr-2 inline h-4 w-4" aria-hidden="true" />
                                {t("redirectNote")}
                            </div>

                            {hasAnyPaymentProvider ? (
                                <>
                                    {/* Stripe primeiro: é o meio principal. Cada botão
                                        some sozinho quando seu provedor não está
                                        configurado, então a ordem aqui é a ordem que o
                                        comprador vê. */}
                                    <StripeCheckoutButton items={paypalItems} currency={currency} />

                                    <div className="mt-3">
                                        <PayPalButtonsWrapper items={paypalItems} currency={currency} />
                                    </div>
                                </>
                            ) : (
                                <div
                                    role="alert"
                                    className="rounded-lg border border-destructive/30 bg-destructive/10 p-4"
                                >
                                    <p className="font-medium text-destructive">
                                        {t("noProviderTitle")}
                                    </p>
                                    <p className="mt-1 text-sm text-destructive/90">
                                        {t("noProviderDesc")}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid gap-3 md:grid-cols-3">
                        <TrustItem icon={ShieldCheck} title={t("trustSecureTitle")} text={t("trustSecureText")} />
                        <TrustItem icon={CheckCircle2} title={t("trustRecordedTitle")} text={t("trustRecordedText")} />
                        <TrustItem icon={FileDown} title={t("trustImmediateTitle")} text={t("trustImmediateText")} />
                    </div>
                </div>

                <aside>
                    <Card className="sticky top-24">
                        <CardContent className="space-y-6 p-6">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">{t("summaryTitle")}</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {t("summaryItems", { count: items.length })}
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-blue-600">
                                            <Building2 className="h-5 w-5 text-white" aria-hidden="true" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="line-clamp-2 text-sm font-medium text-foreground">
                                                {item.name}
                                            </h3>
                                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                <Users className="h-3 w-3" aria-hidden="true" />
                                                {format.number(item.totalLeads)} leads
                                            </div>
                                            <div className="mt-1 font-semibold text-brand">
                                                {formatCurrency(item.price, item.currency, locale)}
                                            </div>
                                        </div>
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
                                    <span className="text-brand">{formatCurrency(total, currency, locale)}</span>
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
        <li
            aria-current={active ? "step" : undefined}
            className={`list-none rounded-md px-3 py-2 font-medium ${
                active
                    ? "bg-brand text-brand-foreground"
                    : done
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground"
            }`}
        >
            {label}
        </li>
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
        <div className="rounded-lg border bg-card p-4">
            <Icon className="mb-3 h-5 w-5 text-brand-accent-strong" />
            <div className="font-semibold text-foreground">{title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        </div>
    )
}
