import { notFound } from "next/navigation"
import { Link } from "@/lib/i18n/navigation"
import { Suspense } from "react"
import type { ComponentType } from "react"
import { getFormatter, getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { ListPreview } from "@/components/marketplace/list-preview"
import { BuyNowButton } from "@/components/marketplace/buy-now-button"
import { AddToCartButton } from "@/components/marketplace/add-to-cart-button"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    BadgeCheck,
    Building2,
    Calendar,
    CheckCircle,
    DollarSign,
    Download,
    FileSpreadsheet,
    Globe,
    MailCheck,
    RefreshCw,
    Shield,
    Target,
    Users,
} from "lucide-react"

interface ListPageProps {
    params: Promise<{ slug: string }>
}

async function getList(slug: string) {
    return prisma.leadList.findUnique({
        where: {
            slug,
            isActive: true,
        },
    })
}

export async function generateMetadata({ params }: ListPageProps) {
    const { slug } = await params
    const [list, t] = await Promise.all([getList(slug), getTranslations("listing")])

    if (!list) {
        return { title: t("notFound") }
    }

    return {
        title: list.name,
        description: list.description || t("metaFallbackDescription", { count: list.totalLeads }),
    }
}

export default async function ListPage({ params }: ListPageProps) {
    const { slug } = await params
    const [list, t, format] = await Promise.all([
        getList(slug),
        getTranslations("listing"),
        getFormatter(),
    ])

    if (!list) {
        notFound()
    }

    const price = Number(list.price)
    const pricePerLead = list.totalLeads > 0 ? price / list.totalLeads : 0
    // Formatado no locale ativo: "fev. de 2026" para um leitor alemão é ruído.
    const updatedAt = format.dateTime(new Date(list.updatedAt), {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
    const listForCart = {
        id: list.id,
        name: list.name,
        slug: list.slug,
        price,
        currency: list.currency,
        totalLeads: list.totalLeads,
    }

    return (
        <div className="min-h-screen bg-muted/40">
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 py-6">
                    <Link
                        href="/catalog"
                        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        {t("back")}
                    </Link>

                    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
                        <div>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                {list.isFeatured && (
                                    <Badge className="bg-brand text-brand-foreground hover:bg-brand">
                                        {t("featured")}
                                    </Badge>
                                )}
                                <Badge variant="outline" className="border-brand-accent text-brand-accent-strong">
                                    {list.category}
                                </Badge>
                                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                    {t("readyBadge")}
                                </span>
                            </div>
                            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                                {list.name}
                            </h1>
                            {list.description && (
                                <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                                    {list.description}
                                </p>
                            )}
                        </div>

                        <div className="rounded-lg border bg-muted/40 p-4">
                            <div className="grid grid-cols-2 gap-3">
                                <QuickMetric label={t("quickLeads")} value={format.number(list.totalLeads)} />
                                <QuickMetric label={t("quickPricePerLead")} value={formatCurrency(pricePerLead, list.currency)} />
                                <QuickMetric label={t("quickCountries")} value={format.number(list.countries.length)} />
                                <QuickMetric label={t("quickUpdated")} value={updatedAt} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto grid gap-6 px-4 py-6 lg:grid-cols-[1fr_360px] lg:items-start">
                <div className="space-y-6">
                    <section className="rounded-lg border bg-card p-6">
                        <div className="mb-5 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">{t("coverageTitle")}</h2>
                                <p className="text-sm text-muted-foreground">{t("coverageSubtitle")}</p>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <DataItem label={t("fieldName")} value={list.name} icon={Building2} fallback={t("notInformed")} />
                            <DataItem label={t("fieldCountries")} value={list.countries.join(", ")} icon={Globe} fallback={t("notInformed")} />
                            <DataItem label={t("fieldTotalLeads")} value={format.number(list.totalLeads)} icon={Users} fallback={t("notInformed")} />
                            <DataItem label={t("fieldIndustries")} value={list.industries.join(", ")} icon={Target} fallback={t("notInformed")} />
                            <DataItem label={t("fieldPricePerLead")} value={formatCurrency(pricePerLead, list.currency)} icon={DollarSign} fallback={t("notInformed")} />
                            <DataItem label={t("fieldUpdatedAt")} value={updatedAt} icon={Calendar} fallback={t("notInformed")} />
                        </div>
                    </section>

                    <section className="rounded-lg border bg-card p-6">
                        <div className="mb-4 flex flex-col gap-1">
                            <h2 className="text-lg font-semibold text-foreground">{t("previewTitle")}</h2>
                            <p className="text-sm text-muted-foreground">
                                {t("previewSubtitle", { count: Math.min(5, list.totalLeads) })}
                            </p>
                        </div>
                        <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-muted" />}>
                            <ListPreview previewData={list.previewData} />
                        </Suspense>
                    </section>

                    <section className="rounded-lg border bg-card p-6">
                        <h2 className="mb-4 text-lg font-semibold text-foreground">{t("includedTitle")}</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <IncludedItem icon={Building2} text={t("includedCompany")} />
                            <IncludedItem icon={MailCheck} text={t("includedEmail")} />
                            <IncludedItem icon={Users} text={t("includedPhone")} />
                            <IncludedItem icon={Globe} text={t("includedLocation")} />
                            <IncludedItem icon={Target} text={t("includedIndustry")} />
                            <IncludedItem icon={FileSpreadsheet} text={t("includedFormats")} />
                        </div>
                    </section>
                </div>

                <aside className="lg:sticky lg:top-24">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <div className="mb-6">
                            <div className="text-4xl font-bold text-brand">
                                {formatCurrency(price, list.currency)}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                                {t("perLead", { price: formatCurrency(pricePerLead, list.currency) })}
                            </div>
                        </div>

                        <div className="mb-6 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                            <div className="font-semibold text-foreground">
                                {t("leadsIncluded", { count: format.number(list.totalLeads) })}
                            </div>
                            <p className="mt-1">{t("oneOffNote")}</p>
                        </div>

                        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
                            {t("beforeBuyNote")}
                        </div>

                        <div className="space-y-3">
                            <BuyNowButton list={listForCart} />
                            <AddToCartButton list={listForCart} />
                        </div>

                        <div className="mt-6 space-y-3 border-t pt-5">
                            <BenefitItem icon={Shield} text={t("benefitSecure")} />
                            <BenefitItem icon={Download} text={t("benefitImmediate")} />
                            <BenefitItem icon={RefreshCw} text={t("benefitFresh")} />
                            <BenefitItem icon={CheckCircle} text={t("benefitRecorded")} />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}

function QuickMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md bg-card p-3">
            <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
            <div className="mt-1 truncate text-sm font-semibold text-foreground">{value}</div>
        </div>
    )
}

function DataItem({
    label,
    value,
    icon: Icon,
    fallback,
}: {
    label: string
    value: string
    icon: ComponentType<{ className?: string }>
    fallback: string
}) {
    return (
        <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-card text-muted-foreground">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 truncate font-semibold text-foreground">{value || fallback}</div>
            </div>
        </div>
    )
}

function IncludedItem({
    icon: Icon,
    text,
}: {
    icon: ComponentType<{ className?: string }>
    text: string
}) {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4 shrink-0 text-brand-accent-strong" />
            {text}
        </div>
    )
}

function BenefitItem({
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
