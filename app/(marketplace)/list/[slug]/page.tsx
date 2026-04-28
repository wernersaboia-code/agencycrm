// app/(marketplace)/list/[slug]/page.tsx.bak
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { ListPreview } from "@/components/marketplace/list-preview"
import { BuyNowButton } from "@/components/marketplace/buy-now-button"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
    CheckCircle,
    Globe,
    Building2,
    Calendar,
    ArrowLeft,
    DollarSign,
    Users,
    Download,
    RefreshCw,
    Shield,
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
        <div className="min-h-screen bg-gray-50">
            {/* Header Roxo */}
            <header className="bg-[#4a2c5a] h-16 flex items-center px-6">
                <Link href="/catalog" className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-semibold">Voltar ao Catálogo</span>
                </Link>
            </header>

            {/* Conteúdo Principal */}
            <div className="max-w-6xl mx-auto p-6">
                {/* Header da Empresa/Lista */}
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <Building2 className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    {list.isFeatured && (
                                        <Badge className="bg-[#4a2c5a] hover:bg-[#4a2c5a]">Destaque</Badge>
                                    )}
                                    <Badge variant="outline" className="text-[#2ec4b6] border-[#2ec4b6]">
                                        {list.category}
                                    </Badge>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-800">{list.name}</h1>
                                {list.description && (
                                    <p className="text-gray-500 text-sm mt-1">{list.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="bg-gray-50 px-4 py-2 rounded-full flex items-center gap-3 border border-gray-200">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-700">Dados atualizados</span>
                                <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                                    <div className="w-full h-full bg-[#2ec4b6] rounded-full"></div>
                                </div>
                            </div>
                            <button className="w-10 h-10 bg-[#f9ca24] rounded-full flex items-center justify-center hover:bg-yellow-400 transition-colors">
                                <Calendar className="h-5 w-5 text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Coluna Principal - Dados */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Grid de Informações */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <DataItem
                                    label="Nome"
                                    value={list.name}
                                    icon={Building2}
                                />
                                <DataItem
                                    label="Países"
                                    value={list.countries.join(", ")}
                                    icon={Globe}
                                />
                                <DataItem
                                    label="Total de Leads"
                                    value={list.totalLeads.toLocaleString()}
                                    icon={Users}
                                />
                                <DataItem
                                    label="Setores"
                                    value={list.industries.join(", ")}
                                    icon={CheckCircle}
                                />
                                <DataItem
                                    label="Preço por Lead"
                                    value={formatCurrency(pricePerLead, list.currency)}
                                    icon={DollarSign}
                                />
                                <DataItem
                                    label="Atualizado"
                                    value={new Date(list.updatedAt).toLocaleDateString('pt-BR', {
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                    icon={Calendar}
                                />
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-800 mb-4">
                                Preview ({Math.min(5, list.totalLeads)} de {list.totalLeads})
                            </h3>
                            <Suspense fallback={<div className="h-48 bg-gray-100 rounded-lg animate-pulse" />}>
                                <ListPreview previewData={list.previewData} />
                            </Suspense>
                        </div>

                        {/* O que está incluído */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-800 mb-4">O que está incluído</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <IncludedItem text="Nome da empresa" />
                                <IncludedItem text="Email comercial verificado" />
                                <IncludedItem text="Telefone de contato" />
                                <IncludedItem text="País e cidade" />
                                <IncludedItem text="Setor de atuação" />
                                <IncludedItem text="Website" />
                                <IncludedItem text="Nome do contato" />
                                <IncludedItem text="Cargo do contato" />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Compra */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-6">
                            <div className="mb-6">
                                <div className="text-4xl font-bold text-[#4a2c5a] mb-1">
                                    {formatCurrency(Number(list.price), list.currency)}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {formatCurrency(pricePerLead, list.currency)}/lead
                                </div>
                            </div>

                            <div className="text-sm text-gray-600 mb-6 pb-6 border-b border-gray-100">
                                <span className="font-semibold text-gray-800">{list.totalLeads.toLocaleString()}</span> leads incluídos
                            </div>

                            <BuyNowButton list={{
                                id: list.id,
                                name: list.name,
                                slug: list.slug,
                                price: Number(list.price),
                                currency: list.currency,
                                totalLeads: list.totalLeads,
                            }} />

                            <p className="text-xs text-gray-500 text-center mt-4">
                                <CheckCircle className="h-3 w-3 inline mr-1 text-[#2ec4b6]" />
                                Pagamento seguro via PayPal
                            </p>

                            {/* Benefícios */}
                            <div className="mt-6 space-y-3">
                                <BenefitItem icon={CheckCircle} text="Acesso imediato após pagamento" />
                                <BenefitItem icon={Download} text="Download em CSV/Excel" />
                                <BenefitItem icon={RefreshCw} text="Dados atualizados" />
                                <BenefitItem icon={Shield} text="Compra segura" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function DataItem({
                      label,
                      value,
                      icon: Icon
                  }: {
    label: string
    value: string
    icon: React.ElementType
}) {
    return (
        <div className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-1">{label}</div>
                <div className="font-semibold text-gray-800 truncate">{value}</div>
            </div>
            <CheckCircle className="h-5 w-5 text-[#2ec4b6] flex-shrink-0" />
        </div>
    )
}

function IncludedItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-[#2ec4b6] flex-shrink-0" />
            {text}
        </div>
    )
}

function BenefitItem({
                         icon: Icon,
                         text
                     }: {
    icon: React.ElementType
    text: string
}) {
    return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
            <Icon className="h-4 w-4 text-[#2ec4b6]" />
            {text}
        </div>
    )
}

