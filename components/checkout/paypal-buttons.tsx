// components/checkout/paypal-buttons.tsx
"use client"

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useCart } from "@/contexts/cart-context"
import { getOptionalPublicPaypalClientId } from "@/lib/env"

interface PayPalButtonsWrapperProps {
    items: Array<{ listId: string; quantity: number }>
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

export function PayPalButtonsWrapper({ items }: PayPalButtonsWrapperProps) {
    const router = useRouter()
    const { clearCart } = useCart()
    const t = useTranslations("checkout")
    const paypalClientId = getOptionalPublicPaypalClientId()

    if (!paypalClientId) {
        // O nome da variável de ambiente é problema do time, não do comprador.
        console.error("NEXT_PUBLIC_PAYPAL_CLIENT_ID ausente — botões do PayPal não renderizados")

        return (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
                <p className="text-sm text-destructive">
                    {t("unavailable")}
                </p>
            </div>
        )
    }

    return (
        <PayPalScriptProvider
            options={{
                clientId: paypalClientId,
                currency: "EUR",
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
                            body: JSON.stringify({ items }),
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
                            router.push("/sign-in?redirect=/checkout")
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

                        // Redirecionar para página de sucesso
                        router.push(`/checkout/success?purchaseId=${result.purchaseId}`)

                        toast.success(t("paymentConfirmed"))
                    } catch (error: unknown) {
                        if (isSessionExpired(error)) {
                            toast.error(t("sessionExpiredOrder"))
                            router.push("/sign-in?redirect=/my-purchases")
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
