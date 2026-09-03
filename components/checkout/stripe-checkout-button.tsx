// components/checkout/stripe-checkout-button.tsx
"use client"

import { useState } from "react"
// eslint-disable-next-line no-restricted-imports -- usado só para /sign-in, fora do segmento de locale
import { useRouter as usePlainRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { CreditCard, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { getOptionalPublicStripePublishableKey } from "@/lib/env"

interface StripeCheckoutButtonProps {
    items: Array<{ listId: string }>
    /** Moeda do carrinho. O preço em si continua saindo do banco, na rota. */
    currency: string
}

type CreateSessionResponse = {
    url?: string
    error?: string
}

export function StripeCheckoutButton({ items, currency }: StripeCheckoutButtonProps) {
    const t = useTranslations("checkout")
    const locale = useLocale()
    // /sign-in fica fora do segmento de locale — usa o router puro do Next
    // para não ganhar um prefixo de idioma que a rota não tem.
    const plainRouter = usePlainRouter()
    const [isLoading, setIsLoading] = useState(false)
    const stripePublishableKey = getOptionalPublicStripePublishableKey()

    if (!stripePublishableKey) {
        // Stripe desconfigurado some da tela em vez de exibir erro — o PayPal
        // segue como opção disponível.
        return null
    }

    async function handleClick() {
        setIsLoading(true)
        try {
            const response = await fetch("/api/checkout/stripe/create-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, currency }),
            })

            const data = await response.json() as CreateSessionResponse

            if (!response.ok || !data.url) {
                console.error("create-session failed:", response.status, data.error)

                if (response.status === 401 || response.status === 403) {
                    toast.error(t("sessionExpiredPay"))
                    plainRouter.push(`/sign-in?redirect=/checkout&lang=${locale}`)
                } else {
                    toast.error(t("createFailed"))
                }
                setIsLoading(false)
                return
            }

            // Redirect para o checkout hospedado do Stripe. O loading fica
            // ligado de propósito: a navegação descarrega esta página.
            window.location.href = data.url
        } catch (error) {
            console.error("create-session error:", error)
            toast.error(t("createFailed"))
            setIsLoading(false)
        }
    }

    return (
        <Button
            type="button"
            variant="outline"
            className="h-[45px] w-full"
            disabled={isLoading}
            onClick={handleClick}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
                <CreditCard className="h-4 w-4" aria-hidden="true" />
            )}
            {t("payWithCard")}
        </Button>
    )
}
