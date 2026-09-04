"use client"

import { useLocale, useTranslations } from "next-intl"
import { CheckCircle, Download, Shield } from "lucide-react"
import type { ComponentType } from "react"
import { BuyNowButton } from "@/components/marketplace/buy-now-button"
import { AddToCartButton } from "@/components/marketplace/add-to-cart-button"
import { useActiveCurrency } from "@/lib/currency/client"
import { pickPrice, type StoredPrice } from "@/lib/marketplace/list-prices"
import type { Currency } from "@/lib/currency"
import { formatCurrency } from "@/lib/utils"

interface ListPriceBoxProps {
    list: { id: string; name: string; slug: string; totalLeads: number }
    /** TODAS as moedas cadastradas da lista, não a escolhida. */
    precos: StoredPrice[]
    /** Coluna antiga de `LeadList`, para lista sem nenhuma linha de preço. */
    precoLegado: { amount: number; currency: string }
}

/**
 * Caixa de preço e botões de compra da ficha do estudo.
 *
 * É componente de cliente por um motivo de indexação, não de interação: a
 * moeda ativa vive num cookie, e ler cookie no servidor tornava a página
 * inteira dinâmica. Com 77 fichas no catálogo, isso significava que cada
 * visita do Googlebot pagava um render de origem e duas consultas ao banco,
 * sem nada em cache na CDN (`Cache-Control: private, no-store`).
 *
 * E não comprava nada: robô não manda cookie de moeda, então o servidor sempre
 * resolvia para o euro padrão de qualquer forma. O JSON-LD da página já
 * reconhecia isso — declara todas as moedas em vez de eleger uma.
 *
 * Agora o servidor manda todas as moedas e quem escolhe é o cliente. O HTML
 * pré-renderizado sai em euro (o mesmo que qualquer visitante sem cookie vê);
 * quem tem outra moeda salva vê o valor corrigido na hidratação.
 */
export function ListPriceBox({ list, precos, precoLegado }: ListPriceBoxProps) {
    const t = useTranslations("listing")
    const locale = useLocale()
    const currency = useActiveCurrency()

    // Mesma resolução que rodava no servidor, com a mesma função: lista sem
    // linha de preço nenhuma cai na coluna antiga, para a ficha nunca ficar
    // sem preço por causa de cadastro incompleto.
    const resolvido = pickPrice(precos, currency) ?? {
        amount: precoLegado.amount,
        currency: precoLegado.currency as Currency,
        isFallback: false,
    }

    const listForCart = {
        id: list.id,
        name: list.name,
        slug: list.slug,
        price: resolvido.amount,
        currency: resolvido.currency,
        totalLeads: list.totalLeads,
    }

    return (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-6">
                <div className="text-4xl font-bold text-brand">
                    {formatCurrency(resolvido.amount, resolvido.currency, locale)}
                </div>
            </div>

            <div className="mb-6 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                <p>{t("oneOffNote")}</p>
            </div>

            <div className="space-y-3">
                <BuyNowButton list={listForCart} />
                <AddToCartButton list={listForCart} />
            </div>

            <div className="mt-6 space-y-3 border-t pt-5">
                <BenefitItem icon={Shield} text={t("benefitSecure")} />
                <BenefitItem icon={Download} text={t("benefitImmediate")} />
                <BenefitItem icon={CheckCircle} text={t("benefitRecorded")} />
            </div>
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
