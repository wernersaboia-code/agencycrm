// components/checkout/mercadopago-button.tsx
"use client"

import { useCallback, useEffect, useState } from "react"
// eslint-disable-next-line no-restricted-imports -- usado só para /sign-in, fora do segmento de locale
import { useRouter as usePlainRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Loader2, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { getOptionalPublicMercadoPagoPublicKey } from "@/lib/env"
import { formatCurrency } from "@/lib/utils"

interface MercadoPagoButtonProps {
    items: Array<{ listId: string; quantity: number }>
    /** Moeda do carrinho. A cobrança é sempre em BRL — serve para decidir o aviso. */
    currency: string
}

type QuoteResponse = { total?: number; error?: string }
type CreatePreferenceResponse = { url?: string; error?: string }

export function MercadoPagoButton({ items, currency }: MercadoPagoButtonProps) {
    const t = useTranslations("checkout")
    const locale = useLocale()
    const plainRouter = usePlainRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [totalBrl, setTotalBrl] = useState<number | null>(null)
    const [quoteFailed, setQuoteFailed] = useState(false)
    const publicKey = getOptionalPublicMercadoPagoPublicKey()

    // O carrinho em EUR/USD precisa mostrar o valor em reais ANTES do
    // redirecionamento: o Mercado Pago cobra sempre em BRL e o banco do
    // comprador é quem converte.
    const precisaAviso = currency !== "BRL"
    const itemsKey = JSON.stringify(items)

    const buscarCotacao = useCallback(async () => {
        try {
            const response = await fetch("/api/checkout/mercadopago/quote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, currency }),
            })

            const data = (await response.json()) as QuoteResponse

            if (!response.ok || typeof data.total !== "number") {
                console.error("quote failed:", response.status, data.error)
                setQuoteFailed(true)
                return
            }

            setTotalBrl(data.total)
        } catch (error) {
            console.error("quote error:", error)
            setQuoteFailed(true)
        }
        // itemsKey entra nas deps no useEffect abaixo; items é estável por render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemsKey, currency])

    useEffect(() => {
        if (!publicKey || !precisaAviso) return
        buscarCotacao()
    }, [publicKey, precisaAviso, buscarCotacao])

    if (!publicKey) {
        // Provedor desconfigurado some da tela; o aviso de "nenhum provedor"
        // é responsabilidade da página de checkout.
        return null
    }

    // Sem saber o valor em reais, não redireciona: melhor não vender que
    // mandar alguém para um número que ele não viu.
    if (precisaAviso && quoteFailed) {
        return (
            <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{t("createFailed")}</p>
            </div>
        )
    }

    const aguardandoCotacao = precisaAviso && totalBrl === null

    async function handleClick() {
        setIsLoading(true)
        try {
            const response = await fetch("/api/checkout/mercadopago/create-preference", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, currency }),
            })

            const data = (await response.json()) as CreatePreferenceResponse

            if (!response.ok || !data.url) {
                console.error("create-preference failed:", response.status, data.error)

                if (response.status === 401 || response.status === 403) {
                    toast.error(t("sessionExpiredPay"))
                    plainRouter.push(`/sign-in?redirect=/checkout&lang=${locale}`)
                } else {
                    toast.error(t("createFailed"))
                }
                setIsLoading(false)
                return
            }

            // O loading fica ligado de propósito: a navegação descarrega a página.
            window.location.href = data.url
        } catch (error) {
            console.error("create-preference error:", error)
            toast.error(t("createFailed"))
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-3">
            {precisaAviso && totalBrl !== null && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                    {t("brlChargeNotice", { amount: formatCurrency(totalBrl, "BRL", locale) })}
                </div>
            )}

            <Button
                type="button"
                className="h-[45px] w-full"
                disabled={isLoading || aguardandoCotacao}
                onClick={handleClick}
            >
                {isLoading || aguardandoCotacao ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                )}
                {t("payWithMercadoPago")}
            </Button>
        </div>
    )
}
