// components/checkout/paypal-button-placeholder.tsx
"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { createPurchase } from "@/actions/checkout"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface PayPalButtonPlaceholderProps {
    listId?: string
    total: number
    currency: string
}

export function PayPalButtonPlaceholder({
                                            listId,
                                            total,
                                            currency
                                        }: PayPalButtonPlaceholderProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handlePayPalClick = async () => {
        if (!listId) {
            toast.error("Nenhuma lista selecionada")
            return
        }

        setLoading(true)

        try {
            // Criar purchase no banco
            const result = await createPurchase(listId)

            if (result.success && result.purchase) {
                // TODO: Quando PayPal estiver integrado:
                // 1. Criar ordem no PayPal via API
                // 2. Abrir popup do PayPal
                // 3. Aguardar aprovação
                // 4. Capturar pagamento
                // 5. Redirecionar para success

                // Por enquanto, redirect direto para success (simulação)
                toast.success("Compra criada! (Simulação)")
                router.push(`/checkout/success?purchaseId=${result.purchase.id}`)
            } else {
                toast.error(result.error || "Erro ao criar compra")
            }
        } catch (error) {
            console.error("Erro no checkout:", error)
            toast.error("Erro ao processar compra")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Botão PayPal (Placeholder) */}
            <button
                onClick={handlePayPalClick}
                disabled={loading || !listId}
                className="w-full h-12 bg-[#FFC439] hover:bg-[#F4B731] rounded-lg font-semibold text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <span className="animate-pulse">Processando...</span>
                ) : (
                    <>
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.554 9.488c.121.533.166 1.155.166 1.85 0 3.857-2.496 6.663-6.938 6.663h-1.72c-.416 0-.77.302-.852.71l-.01.057-.345 2.186a.516.516 0 0 1-.509.428H7.225a.516.516 0 0 1-.511-.598l1.455-9.22a.856.856 0 0 1 .843-.72h2.43c1.596 0 2.856-.323 3.732-.964.876-.641 1.326-1.56 1.326-2.73 0-.343-.035-.668-.104-.973a3.28 3.28 0 0 0-.312-.833 2.49 2.49 0 0 0-.52-.641 2.09 2.09 0 0 0-.737-.416 3.3 3.3 0 0 0-.964-.14h-1.64a.516.516 0 0 0-.51.429l-.023.146-.288 1.825a.516.516 0 0 1-.509.428H9.515a.516.516 0 0 1-.511-.598l.146-.923a.856.856 0 0 1 .843-.72h2.86c1.92 0 3.46.394 4.58 1.172 1.12.778 1.856 1.92 2.18 3.406z"/>
                        </svg>
                        Pagar com PayPal
                    </>
                )}
            </button>

            {/* Outros Métodos (Placeholder) */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <hr className="w-full border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-white px-2 text-xs text-gray-500">
                        Ou pague com
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-11" disabled>
                    Cartão de Crédito
                </Button>
                <Button variant="outline" className="h-11" disabled>
                    PIX
                </Button>
            </div>
        </div>
    )
}