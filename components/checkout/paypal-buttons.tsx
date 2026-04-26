// components/checkout/paypal-buttons.tsx
"use client"

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCart } from "@/contexts/cart-context"

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

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback
}

export function PayPalButtonsWrapper({ items }: PayPalButtonsWrapperProps) {
    const router = useRouter()
    const { clearCart } = useCart()

    if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-red-600 text-sm">
                    PayPal não configurado. Adicione NEXT_PUBLIC_PAYPAL_CLIENT_ID no .env
                </p>
            </div>
        )
    }

    return (
        <PayPalScriptProvider
            options={{
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
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
                            throw new Error(data.error || "Erro ao criar pedido")
                        }

                        return data.orderId
                    } catch (error: unknown) {
                        toast.error(getErrorMessage(error, "Erro ao processar pagamento"))
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
                            throw new Error(result.error || "Erro ao capturar pagamento")
                        }

                        // Limpar carrinho
                        clearCart()

                        // Redirecionar para página de sucesso
                        router.push(`/checkout/success?purchaseId=${result.purchaseId}`)

                        toast.success("Pagamento confirmado!")
                    } catch (error: unknown) {
                        toast.error(getErrorMessage(error, "Erro ao confirmar pagamento"))
                    }
                }}
                onError={(err) => {
                    console.error("PayPal error:", err)
                    toast.error("Erro no processamento do pagamento")
                }}
                onCancel={() => {
                    router.push("/checkout/cancel")
                }}
            />
        </PayPalScriptProvider>
    )
}
