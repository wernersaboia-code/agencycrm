// components/checkout/paypal-buttons.tsx
"use client"

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js"
// eslint-disable-next-line no-restricted-imports -- usado só para /sign-in, fora do segmento de locale
import { useRouter as usePlainRouter } from "next/navigation"
import { useRouter } from "@/lib/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { useCart } from "@/contexts/cart-context"
import { getOptionalPublicPaypalClientId } from "@/lib/env"

interface PayPalButtonsWrapperProps {
    items: Array<{ listId: string }>
    /**
     * Moeda do carrinho. O SDK precisa carregar nela — com "EUR" fixo aqui, o
     * script abria em euro enquanto o pedido era montado noutra moeda.
     */
    currency: string
}

type CreateOrderResponse = {
    orderId?: string
    error?: string
}

type CaptureOrderResponse = {
    purchaseId?: string
    error?: string
}

/**
 * Mensagens da API nunca chegam cruas ao usuário — `error: "Unauthorized"`
 * apareceria como toast em inglês num funil PT/DE. O status manda.
 */
class CheckoutError extends Error {
    constructor(message: string, readonly status: number) {
        super(message)
    }
}

function isSessionExpired(error: unknown): boolean {
    return error instanceof CheckoutError && (error.status === 401 || error.status === 403)
}

export function PayPalButtonsWrapper({ items, currency }: PayPalButtonsWrapperProps) {
    const router = useRouter()
    // /sign-in fica fora do segmento de locale — usa o router puro do Next
    // para não ganhar um prefixo de idioma que a rota não tem.
    const plainRouter = usePlainRouter()
    const { clearCart } = useCart()
    const t = useTranslations("checkout")
    const locale = useLocale()
    const paypalClientId = getOptionalPublicPaypalClientId()

    if (!paypalClientId) {
        // PayPal desconfigurado some da tela, mesmo comportamento do botão do
        // Stripe. Antes daqui saía uma caixa de erro vermelha: fazia sentido
        // quando o PayPal era o único meio de pagamento, mas hoje ele é
        // opcional — e erro de configuração de um provedor inativo não é
        // assunto do comprador. Quem avisa quando NENHUM provedor está
        // configurado é a página de checkout, que enxerga os dois.
        return null
    }

    return (
        <PayPalScriptProvider
            options={{
                clientId: paypalClientId,
                currency,
                intent: "capture",
            }}
        >
            <PayPalButtons
                style={{
                    layout: "vertical",
                    color: "gold",
                    shape: "rect",
                    label: "pay",
                    height: 45,
                }}
                createOrder={async () => {
                    try {
                        const response = await fetch("/api/checkout/create-order", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ items, currency }),
                        })

                        const data = await response.json() as CreateOrderResponse

                        if (!response.ok || !data.orderId) {
                            console.error("create-order failed:", response.status, data.error)
                            throw new CheckoutError("create-order failed", response.status)
                        }

                        return data.orderId
                    } catch (error: unknown) {
                        if (isSessionExpired(error)) {
                            toast.error(t("sessionExpiredPay"))
                            plainRouter.push(`/sign-in?redirect=/checkout&lang=${locale}`)
                        } else {
                            toast.error(t("createFailed"))
                        }
                        throw error
                    }
                }}
                onApprove={async (data) => {
                    try {
                        const response = await fetch("/api/checkout/capture-order", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ orderId: data.orderID }),
                        })

                        const result = await response.json() as CaptureOrderResponse

                        if (!response.ok || !result.purchaseId) {
                            console.error("capture-order failed:", response.status, result.error)
                            throw new CheckoutError("capture-order failed", response.status)
                        }

                        // Limpar carrinho
                        clearCart()

                        // Redirecionar para página de sucesso (dentro do segmento de locale)
                        router.push(`/checkout/success?purchaseId=${result.purchaseId}`)

                        toast.success(t("paymentConfirmed"))
                    } catch (error: unknown) {
                        if (isSessionExpired(error)) {
                            toast.error(t("sessionExpiredOrder"))
                            plainRouter.push(`/sign-in?redirect=/my-purchases&lang=${locale}`)
                            return
                        }

                        // O pagamento pode ter sido aprovado no PayPal e falhado
                        // só na confirmação do nosso lado — o usuário precisa
                        // saber onde procurar em vez de tentar pagar de novo.
                        toast.error(
                            t("captureFailed"),
                            { duration: 10000 }
                        )
                    }
                }}
                onError={(err) => {
                    console.error("PayPal error:", err)
                    toast.error(t("paypalError"))
                }}
                onCancel={() => {
                    router.push("/checkout/cancel")
                }}
            />
        </PayPalScriptProvider>
    )
}
