// app/(marketplace)/list/[slug]/page.tsx
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { ListPreview } from "@/components/marketplace/list-preview"
import { AddToCartButton } from "@/components/marketplace/add-to-cart-button"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
    CheckCircle,
    Globe,
    Building2,
    Calendar,
    ArrowLeft
} from "lucide-react"
import Link from "next/link"

interface ListPageProps {
    params: Promise<{ slug: string }>
}

async function getList(slug: string) {
    const list = await prisma.leadList.findUnique({
        where: {
            slug,
            isActive: true
        },
    })

    return list
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

    const pricePerLead = list.totalLeads > 0
        ? Number(list.price) / list.totalLeads
        : 0

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <Link
                href="/catalog"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao catálogo
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            {list.isFeatured && (
                                <Badge variant="default">Destaque</Badge>
                            )}
                            <Badge variant="outline">{list.category}</Badge>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">{list.name}</h1>
                        {list.description && (
                            <p className="text-muted-foreground">{list.description}</p>
                        )}
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InfoCard
                            icon={Building2}
                            label="Leads"
                            value={list.totalLeads.toLocaleString()}
                        />
                        <InfoCard
                            icon={Globe}
                            label="Países"
                            value={list.countries.join(", ")}
                        />
                        <InfoCard
                            icon={CheckCircle}
                            label="Verificados"
                            value="85%+"
                        />
                        <InfoCard
                            icon={Calendar}
                            label="Atualizado"
                            value={new Date(list.updatedAt).toLocaleDateString('pt-BR', {
                                month: 'short',
                                year: 'numeric'
                            })}
                        />
                    </div>

                    {/* Setores */}
                    {list.industries.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2">Setores</h3>
                            <div className="flex flex-wrap gap-2">
                                {list.industries.map((industry) => (
                                    <Badge key={industry} variant="secondary">
                                        {industry}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    <div>
                        <h3 className="font-semibold mb-4">
                            Preview ({Math.min(5, list.totalLeads)} de {list.totalLeads})
                        </h3>
                        <Suspense fallback={<div className="h-48 bg-muted animate-pulse rounded-lg" />}>
                            <ListPreview listId={list.id} previewData={list.previewData} />
                        </Suspense>
                    </div>

                    {/* O que está incluído */}
                    <div className="border rounded-lg p-6">
                        <h3 className="font-semibold mb-4">O que está incluído</h3>
                        <ul className="space-y-2">
                            <IncludedItem text="Nome da empresa" />
                            <IncludedItem text="Email comercial verificado" />
                            <IncludedItem text="Telefone de contato" />
                            <IncludedItem text="País e cidade" />
                            <IncludedItem text="Setor de atuação" />
                            <IncludedItem text="Website" />
                            <IncludedItem text="Nome do contato (quando disponível)" />
                        </ul>
                    </div>
                </div>

                {/* Sidebar - Compra */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8 border rounded-lg p-6 space-y-4">
                        <div>
                            <div className="text-3xl font-bold">
                                {formatCurrency(Number(list.price), list.currency)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {formatCurrency(pricePerLead, list.currency)}/lead
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            {list.totalLeads.toLocaleString()} leads incluídos
                        </div>

                        <AddToCartButton list={{
                            id: list.id,
                            name: list.name,
                            slug: list.slug,
                            price: Number(list.price),
                            currency: list.currency,
                            totalLeads: list.totalLeads,
                        }} />

                        <p className="text-xs text-muted-foreground text-center">
                            Pagamento seguro via PayPal
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function InfoCard({
                      icon: Icon,
                      label,
                      value
                  }: {
    icon: React.ElementType
    label: string
    value: string
}) {
    return (
        <div className="border rounded-lg p-4 text-center">
            <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="font-semibold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
        </div>
    )
}

function IncludedItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            {text}
        </li>
    )
}