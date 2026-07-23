import { Suspense } from "react"
import type { ComponentType } from "react"
// eslint-disable-next-line no-restricted-imports -- único uso restante é /sign-in, fora do segmento de locale
import { redirect } from "next/navigation"
import {
    AlertTriangle,
    ArrowLeft,
    Database,
    DollarSign,
    FileDown,
    KeyRound,
    Package,
    Rocket,
    ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getUserPurchases } from "@/actions/checkout"
import type { UserPurchase } from "@/actions/checkout"
import { PublicPurchaseCard } from "@/components/marketplace/public-purchase-card"
import { MyPurchasesEmptyState } from "@/components/marketplace/my-purchases-empty-state"
import { validatePurchaseAccessToken } from "@/lib/auth/magic-link"
import { getAuthenticatedUserId } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"
import { getFormatter, getLocale, getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { Link as LocaleLink } from "@/lib/i18n/navigation"

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("purchases")

    return {
        title: t("metaTitle"),
        description: t("metaDescription"),
    }
}

interface PageProps {
    searchParams: Promise<{ token?: string }>
}

async function PurchasesContent({ searchParams }: PageProps) {
    const { token } = await searchParams
    const t = await getTranslations("purchases")

    if (token) {
        const validation = await validatePurchaseAccessToken(token)

        if (!validation.valid) {
            return (
                <InvalidTokenState
                    title={t("invalidTokenTitle")}
                    ctaLabel={t("goToCatalog")}
                    message={
                        validation.error === "Token expirado"
                            ? t("invalidTokenExpired")
                            : t("invalidTokenGeneric")
                    }
                />
            )
        }

        const purchases = await getUserPurchases()
        const filteredPurchases = validation.purchaseId
            ? purchases.filter((purchase) => purchase.id === validation.purchaseId)
            : purchases

        return (
            <PurchasesDashboard
                purchases={filteredPurchases}
                tokenNotice={validation.purchaseId ? t("magicLinkNotice") : undefined}
            />
        )
    }

    const userId = await getAuthenticatedUserId()

    if (!userId) {
        const locale = await getLocale()
        redirect(`/sign-in?redirect=/my-purchases&lang=${locale}`)
    }

    const purchases = await getUserPurchases()

    return <PurchasesDashboard purchases={purchases} />
}

async function PurchasesDashboard({
    purchases,
    tokenNotice,
}: {
    purchases: UserPurchase[]
    tokenNotice?: string
}) {
    const stats = getPurchaseStats(purchases)
    const currency = purchases[0]?.currency || "EUR"
    const t = await getTranslations("purchases")
    const format = await getFormatter()

    return (
        <div className="min-h-screen bg-muted/40">
            <section className="border-b bg-card">
                <div className="container mx-auto px-4 py-6">
                    <Button variant="ghost" className="mb-4 px-0 text-muted-foreground hover:text-brand" asChild>
                        <LocaleLink href="/catalog">
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            {t("back")}
                        </LocaleLink>
                    </Button>

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                                <FileDown className="h-4 w-4" aria-hidden="true" />
                                {t("badge")}
                            </div>
                            <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
                            <p className="mt-2 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
                            {tokenNotice && (
                                <p className="mt-2 inline-flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                                    {tokenNotice}
                                </p>
                            )}
                        </div>

                        {purchases.length > 0 && (
                            <Button className="bg-brand text-brand-foreground hover:bg-brand-hover" asChild>
                                <LocaleLink href="/catalog">
                                    <Rocket className="h-4 w-4" aria-hidden="true" />
                                    {t("browseMoreLists")}
                                </LocaleLink>
                            </Button>
                        )}
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            label={t("statPurchases")}
                            value={format.number(stats.totalPurchases)}
                            icon={ShoppingBag}
                            tone="blue"
                        />
                        <StatCard
                            label={t("statLists")}
                            value={format.number(stats.totalLists)}
                            icon={Package}
                            tone="indigo"
                        />
                        <StatCard
                            label={t("statLeads")}
                            value={format.number(stats.totalLeads)}
                            icon={Database}
                            tone="violet"
                        />
                        <StatCard
                            label={t("statSpent")}
                            value={formatCurrency(stats.totalSpent, currency)}
                            icon={DollarSign}
                            tone="amber"
                        />
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-8">
                {purchases.length === 0 ? (
                    <MyPurchasesEmptyState />
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
                        <div className="space-y-4">
                            {purchases.map((purchase) => (
                                <PublicPurchaseCard key={purchase.id} purchase={purchase} />
                            ))}
                        </div>

                        <aside className="rounded-lg border bg-card p-5 shadow-sm lg:sticky lg:top-24">
                            <h2 className="text-lg font-semibold text-foreground">
                                {t("nextStepsTitle")}
                            </h2>
                            <div className="mt-4 space-y-4">
                                <GuidanceItem
                                    icon={FileDown}
                                    title={t("guidancePdfTitle")}
                                    text={t("guidancePdfText")}
                                />
                                <GuidanceItem
                                    icon={Database}
                                    title={t("guidanceCrmTitle")}
                                    text={t("guidanceCrmText")}
                                />
                                <GuidanceItem
                                    icon={Rocket}
                                    title={t("guidanceMarketTitle")}
                                    text={t("guidanceMarketText")}
                                />
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    )
}

function getPurchaseStats(purchases: UserPurchase[]) {
    return purchases.reduce(
        (stats, purchase) => {
            stats.totalPurchases += 1
            stats.totalLists += purchase.items.length
            stats.totalLeads += purchase.items.reduce((sum, item) => sum + item.list.totalLeads, 0)
            stats.totalSpent += purchase.total
            return stats
        },
        {
            totalPurchases: 0,
            totalLists: 0,
            totalLeads: 0,
            totalSpent: 0,
        }
    )
}

function InvalidTokenState({
    title,
    message,
    ctaLabel,
}: {
    title: string
    message: string
    ctaLabel: string
}) {
    return (
        <div className="min-h-[70vh] bg-muted/40 px-4 py-16">
            <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-md bg-destructive/10">
                    <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-foreground">{title}</h2>
                <p className="mb-6 text-sm text-muted-foreground">{message}</p>
                <Button className="bg-brand text-brand-foreground hover:bg-brand-hover" asChild>
                    <LocaleLink href="/catalog">{ctaLabel}</LocaleLink>
                </Button>
            </div>
        </div>
    )
}

function StatCard({
    label,
    value,
    icon: Icon,
    tone,
}: {
    label: string
    value: string
    icon: ComponentType<{ className?: string }>
    tone: "blue" | "indigo" | "violet" | "amber"
}) {
    const tones = {
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
        indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
        violet: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
        amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    }

    return (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-md ${tones[tone]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <div className="truncate text-xl font-bold text-foreground">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                </div>
            </div>
        </div>
    )
}

function GuidanceItem({
    icon: Icon,
    title,
    text,
}: {
    icon: ComponentType<{ className?: string }>
    title: string
    text: string
}) {
    return (
        <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-accent/15 text-brand-accent-strong">
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <div className="font-medium text-foreground">{title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
        </div>
    )
}

export default async function MyPurchasesPage({ searchParams }: PageProps) {
    const t = await getTranslations("purchases")

    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-muted/40 px-4 py-16">
                    <div className="mx-auto max-w-md text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-brand/10">
                            <ShoppingBag className="h-7 w-7 animate-pulse text-brand" aria-hidden="true" />
                        </div>
                        <p className="text-muted-foreground">{t("loading")}</p>
                    </div>
                </div>
            }
        >
            <PurchasesContent searchParams={searchParams} />
        </Suspense>
    )
}
