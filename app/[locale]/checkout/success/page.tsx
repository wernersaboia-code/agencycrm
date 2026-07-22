// eslint-disable-next-line no-restricted-imports -- único uso restante é /sign-in, fora do segmento de locale
import { redirect } from "next/navigation"
import type { ComponentType } from "react"
import type { Metadata } from "next"
import type { Prisma } from "@prisma/client"
import { getFormatter, getLocale, getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUserId } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { ArrowRight, CheckCircle, Download, Mail, Rocket, ShoppingBag } from "lucide-react"
import { Confetti } from "@/components/motion/confetti"
import { Link as LocaleLink, getPathname } from "@/lib/i18n/navigation"

interface SuccessPageProps {
    searchParams: Promise<{ purchaseId?: string }>
}

type PurchaseItemWithList = Prisma.PurchaseItemGetPayload<{
    include: {
        list: true
    }
}>

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("checkout")

    return {
        title: t("successMetaTitle"),
        description: t("successMetaDescription"),
    }
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
    const { purchaseId } = await searchParams
    const userId = await getAuthenticatedUserId()
    const t = await getTranslations("checkout")
    const format = await getFormatter()
    const locale = await getLocale()

    if (!userId) {
        // Sem o purchaseId no redirect, uma sessão expirada entre a captura e
        // esta página perde o pedido de forma irrecuperável.
        const target = purchaseId
            ? `/checkout/success?purchaseId=${encodeURIComponent(purchaseId)}`
            : "/my-purchases"
        redirect(`/sign-in?redirect=${encodeURIComponent(target)}`)
    }

    if (!purchaseId) {
        redirect(getPathname({ href: "/catalog", locale }))
    }

    const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId, userId },
        include: {
            items: {
                include: {
                    list: true,
                },
            },
        },
    })

    if (!purchase) {
        redirect(getPathname({ href: "/catalog", locale }))
    }

    const totalLeads = purchase.items.reduce(
        (sum: number, item: PurchaseItemWithList) => sum + item.list.totalLeads,
        0
    )

    return (
        <div className="min-h-screen bg-background px-4 py-10">
            <Confetti active />
            <div className="mx-auto max-w-3xl">
                <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shadow-sm">
                        <CheckCircle className="h-9 w-9 text-primary" />
                    </div>

                    <h1 className="mb-2 text-3xl font-bold text-card-foreground">
                        {t("successTitle")}
                    </h1>
                    <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
                        {t("successSubtitle")}
                    </p>

                    <div className="mb-8 rounded-lg border bg-muted/30 p-5 text-left">
                        <div className="mb-4 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <span className="text-sm text-muted-foreground">{t("successOrder")}</span>
                                <div className="font-mono text-sm font-medium text-card-foreground">
                                    #{purchase.id.slice(0, 8)}
                                </div>
                            </div>
                            <div className="text-left sm:text-right">
                                <span className="text-sm text-muted-foreground">{t("successLeadsReleased")}</span>
                                <div className="font-semibold text-card-foreground">{format.number(totalLeads)}</div>
                            </div>
                        </div>

                        <div className="mb-4 space-y-3">
                            {purchase.items.map((item: PurchaseItemWithList) => (
                                <div key={item.id} className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="truncate font-medium text-card-foreground">
                                            {item.list.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {format.number(item.list.totalLeads)} leads
                                        </div>
                                    </div>
                                    <span className="shrink-0 font-medium text-card-foreground">
                                        {formatCurrency(Number(item.price), purchase.currency)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between border-t pt-4">
                            <span className="font-semibold text-card-foreground">{t("successTotalPaid")}</span>
                            <span className="text-xl font-bold text-primary">
                                {formatCurrency(Number(purchase.total), purchase.currency)}
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <NextStep icon={Download} title={t("successNextDownloadTitle")} text={t("successNextDownloadText")} />
                        <NextStep icon={Rocket} title={t("successNextProspectTitle")} text={t("successNextProspectText")} />
                        <NextStep icon={Mail} title={t("successNextReceiptTitle")} text={t("successNextReceiptText")} />
                    </div>

                    <div className="mt-8 space-y-3">
                        <Button className="h-12 w-full" asChild>
                            <LocaleLink href="/my-purchases">
                                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                                {t("successCtaPurchases")}
                            </LocaleLink>
                        </Button>

                        <div className="grid gap-3">
                            <Button variant="outline" className="h-12" asChild>
                                <LocaleLink href="/catalog">
                                    {t("successCtaContinue")}
                                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                                </LocaleLink>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function NextStep({
    icon: Icon,
    title,
    text,
}: {
    icon: ComponentType<{ className?: string }>
    title: string
    text: string
}) {
    return (
        <div className="rounded-lg border bg-card p-4 text-left">
            <Icon className="mb-3 h-5 w-5 text-primary" />
            <div className="font-semibold text-card-foreground">{title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        </div>
    )
}
