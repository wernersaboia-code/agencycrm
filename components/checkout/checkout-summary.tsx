// components/checkout/checkout-summary.tsx
import { formatCurrency } from "@/lib/utils"
import { CheckCircle, Download, Database, Shield } from "lucide-react"
import type { LeadList } from "@prisma/client"

interface CheckoutSummaryProps {
    list: LeadList | null
}

export function CheckoutSummary({ list }: CheckoutSummaryProps) {
    if (!list) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-center py-8">
                    Nenhuma lista selecionada
                </p>
            </div>
        )
    }

    const pricePerLead = list.totalLeads > 0
        ? Number(list.price) / list.totalLeads
        : 0

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-6">
            <h3 className="font-semibold text-gray-800 mb-4">Resumo do Pedido</h3>

            {/* Lista */}
            <div className="mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                        <Database className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-sm line-clamp-2">
                            {list.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                            {list.totalLeads.toLocaleString()} leads
                        </p>
                    </div>
                </div>
            </div>

            {/* Valores */}
            <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-800">
                        {formatCurrency(Number(list.price), list.currency)}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Taxa de processamento</span>
                    <span className="font-medium text-gray-800">
                        {formatCurrency(0, list.currency)}
                    </span>
                </div>
                <hr className="border-gray-100" />
                <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-800">Total</span>
                    <span className="text-[#4a2c5a]">
                        {formatCurrency(Number(list.price), list.currency)}
                    </span>
                </div>
            </div>

            {/* Benefícios */}
            <div className="space-y-3 pt-6 border-t border-gray-100">
                <BenefitItem
                    icon={Download}
                    text="Download imediato em CSV/Excel"
                />
                <BenefitItem
                    icon={CheckCircle}
                    text={`Preço por lead: ${formatCurrency(pricePerLead, list.currency)}`}
                />
                <BenefitItem
                    icon={Shield}
                    text="Garantia de dados atualizados"
                />
            </div>
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