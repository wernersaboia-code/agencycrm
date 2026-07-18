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
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <p className="text-muted-foreground text-center py-8">
                    Nenhuma lista selecionada
                </p>
            </div>
        )
    }

    const pricePerLead = list.totalLeads > 0
        ? Number(list.price) / list.totalLeads
        : 0

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border sticky top-6">
            <h3 className="font-semibold text-foreground mb-4">Resumo do pedido</h3>

            {/* Lista */}
            <div className="mb-6 pb-6 border-b border-border">
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Database className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-sm line-clamp-2">
                            {list.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                            {list.totalLeads.toLocaleString()} leads
                        </p>
                    </div>
                </div>
            </div>

            {/* Valores */}
            <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">
                        {formatCurrency(Number(list.price), list.currency)}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de processamento</span>
                    <span className="font-medium text-foreground">
                        {formatCurrency(0, list.currency)}
                    </span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between text-lg font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-brand">
                        {formatCurrency(Number(list.price), list.currency)}
                    </span>
                </div>
            </div>

            {/* Benefícios */}
            <div className="space-y-3 pt-6 border-t border-border">
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4 text-brand-accent-strong" />
            {text}
        </div>
    )
}
