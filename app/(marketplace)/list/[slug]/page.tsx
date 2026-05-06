import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import type { ComponentType } from "react"
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
    const list = await getList(slug)

    if (!list) {
        return { title: "Lista não encontrada | LeadStore" }
    }

    return {
        title: `${list.name} | LeadStore`,
        description: list.description || `Lista com ${list.totalLeads} leads qualificados.`,
    }
}

export default async function ListPage({ params }: ListPageProps) {
    const { slug } = await params
    const list = await getList(slug)

    if (!list) {
        notFound()
    }

    const price = Number(list.price)
    const pricePerLead = list.totalLeads > 0 ? price / list.totalLeads : 0
    const updatedAt = new Date(list.updatedAt).toLocaleDateString("pt-BR", {
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
        <div className="min-h-screen bg-gray-50">
            <div className="border-b border-gray-200 bg-white">
                <div className="container mx-auto px-4 py-6">
                    <Link
                        href="/catalog"
                        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#4a2c5a]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar ao catálogo
                    </Link>

                    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
                        <div>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                {list.isFeatured && (
                                    <Badge className="bg-[#4a2c5a] hover:bg-[#4a2c5a]">
                                        Destaque
                                    </Badge>
                                )}
                                <Badge variant="outline" className="border-[#2ec4b6] text-[#1ba399]">
                                    {list.category}
                                </Badge>
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                    <BadgeCheck className="h-3.5 w-3.5" />
                                    Dados prontos para download
                                </span>
                            </div>
                            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                                {list.name}
                            </h1>
                            {list.description && (
                                <p className="mt-3 max-w-2xl text-base text-gray-600">
                                    {list.description}
                                </p>
                            )}
                        </div>

                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="grid grid-cols-2 gap-3">
                                <QuickMetric label="Leads" value={list.totalLeads.toLocaleString()} />
                                <QuickMetric label="Preço/lead" value={formatCurrency(pricePerLead, list.currency)} />
                                <QuickMetric label="Países" value={list.countries.length.toString()} />
                                <QuickMetric label="Atualizada" value={updatedAt} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto grid gap-6 px-4 py-6 lg:grid-cols-[1fr_360px] lg:items-start">
                <div className="space-y-6">
                    <section className="rounded-lg border border-gray-200 bg-white p-6">
                        <div className="mb-5 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Cobertura da lista
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Use estes sinais para validar se a base combina com sua campanha.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <DataItem label="Nome" value={list.name} icon={Building2} />
                            <DataItem label="Países" value={list.countries.join(", ")} icon={Globe} />
                            <DataItem label="Total de leads" value={list.totalLeads.toLocaleString()} icon={Users} />
                            <DataItem label="Setores" value={list.industries.join(", ")} icon={Target} />
                            <DataItem label="Preço por lead" value={formatCurrency(pricePerLead, list.currency)} icon={DollarSign} />
                            <DataItem label="Atualizado em" value={updatedAt} icon={Calendar} />
                        </div>
                    </section>

                    <section className="rounded-lg border border-gray-200 bg-white p-6">
                        <div className="mb-4 flex flex-col gap-1">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Preview dos dados
                            </h2>
                            <p className="text-sm text-gray-500">
                                Amostra de {Math.min(5, list.totalLeads)} registros para checar estrutura e qualidade antes da compra.
                            </p>
                        </div>
                        <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-gray-100" />}>
                            <ListPreview previewData={list.previewData} />
                        </Suspense>
                    </section>

                    <section className="rounded-lg border border-gray-200 bg-white p-6">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">
                            O que está incluído
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <IncludedItem icon={Building2} text="Nome da empresa" />
                            <IncludedItem icon={MailCheck} text="Email comercial verificado" />
                            <IncludedItem icon={Users} text="Telefone e contato quando disponível" />
                            <IncludedItem icon={Globe} text="País, cidade e website" />
                            <IncludedItem icon={Target} text="Setor de atuação" />
                            <IncludedItem icon={FileSpreadsheet} text="Arquivo CSV e Excel" />
                        </div>
                    </section>
                </div>

                <aside className="lg:sticky lg:top-24">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-6">
                            <div className="text-4xl font-bold text-[#4a2c5a]">
                                {formatCurrency(price, list.currency)}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                                {formatCurrency(pricePerLead, list.currency)} por lead
                            </div>
                        </div>

                        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                            <div className="font-semibold text-gray-900">
                                {list.totalLeads.toLocaleString()} leads incluídos
                            </div>
                            <p className="mt-1">
                                Compra avulsa, sem assinatura. O acesso fica disponível na área Minhas Compras.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <BuyNowButton list={listForCart} />
                            <AddToCartButton list={listForCart} />
                        </div>

                        <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
                            <BenefitItem icon={Shield} text="Pagamento seguro via PayPal" />
                            <BenefitItem icon={Download} text="Download imediato após confirmação" />
                            <BenefitItem icon={RefreshCw} text="Dados atualizados antes da publicação" />
                            <BenefitItem icon={CheckCircle} text="Registro da compra na sua conta" />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}

function QuickMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md bg-white p-3">
            <div className="text-xs font-medium uppercase text-gray-500">{label}</div>
            <div className="mt-1 truncate text-sm font-semibold text-gray-900">{value}</div>
        </div>
    )
}

function DataItem({
    label,
    value,
    icon: Icon,
}: {
    label: string
    value: string
    icon: ComponentType<{ className?: string }>
}) {
    return (
        <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-gray-500">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-xs text-gray-500">{label}</div>
                <div className="mt-1 truncate font-semibold text-gray-900">{value || "Não informado"}</div>
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
        <div className="flex items-center gap-2 text-sm text-gray-600">
            <Icon className="h-4 w-4 shrink-0 text-[#2ec4b6]" />
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
        <div className="flex items-start gap-2 text-sm text-gray-600">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#2ec4b6]" />
            {text}
        </div>
    )
}
