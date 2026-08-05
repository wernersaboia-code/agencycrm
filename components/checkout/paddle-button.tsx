// components/checkout/paddle-button.tsx
"use client"

import { useEffect, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports -- usado só para /sign-in, fora do segmento de locale
import { useRouter as usePlainRouter } from "next/navigation"
import { useRouter } from "@/lib/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { CreditCard, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { getOptionalPublicPaddleClientToken, getPublicPaddleEnv } from "@/lib/env"
import { useCart } from "@/contexts/cart-context"

interface PaddleButtonProps {
    items: Array<{ listId: string; quantity: number }>
    /** Moeda do carrinho. O Paddle cobra nela — diferente do Mercado Pago. */
    currency: string
}

type CreateTransactionResponse = { transactionId?: string; purchaseId?: string; error?: string }

// O Paddle.js se instala em window.Paddle. Tipagem mínima: só o que usamos.
type PaddleGlobal = {
    Environment: { set: (env: string) => void }
    Initialize: (options: { token: string; eventCallback?: (event: { name: string; data?: { transaction_id?: string } }) => void }) => void
    Checkout: { open: (options: { transactionId: string }) => void }
}

declare global {
    interface Window {
        Paddle?: PaddleGlobal
    }
}

export function PaddleButton({ items, currency }: PaddleButtonProps) {
    const t = useTranslations("checkout")
    const locale = useLocale()
    // Localizado para a navegação interna; o plain só para /sign-in, que fica
    // fora do segmento de locale. Mesma divisão de mercadopago-return.
    const router = useRouter()
    const plainRouter = usePlainRouter()
    const { clearCart } = useCart()
    const [isLoading, setIsLoading] = useState(false)
    const [scriptPronto, setScriptPronto] = useState(false)
    const clientToken = getOptionalPublicPaddleClientToken()
    const inicializado = useRef(false)
    // O purchaseId da transação aberta, para a navegação de sucesso levá-lo.
    const purchaseIdRef = useRef<string | null>(null)

    useEffect(() => {
        if (!clientToken || inicializado.current) return

        function inicializar() {
            if (!window.Paddle || inicializado.current) return
            inicializado.current = true

            window.Paddle.Environment.set(getPublicPaddleEnv())
            window.Paddle.Initialize({
                token: clientToken,
                eventCallback: (event) => {
                    if (event.name !== "checkout.completed") return

                    const transactionId = event.data?.transaction_id
                    if (!transactionId) return

                    // Caminho rápido. O webhook efetiva de qualquer forma —
                    // mas a navegação para a tela de sucesso só pode acontecer
                    // quando ESTA chamada confirma "fulfilled": em qualquer
                    // outro caso (404, 503, pending, amount_mismatch) a compra
                    // pode não estar paga ainda, e mandar o comprador para a
                    // tela de sucesso o levaria a "Minhas compras" com um
                    // download que devolve 404 — dinheiro cobrado, tela
                    // dizendo que deu certo.
                    fetch("/api/checkout/paddle/confirm-transaction", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ transactionId }),
                    })
                        .then(async (response) => {
                            const data = (await response.json()) as {
                                status?: string
                                purchaseId?: string
                            }

                            if (
                                response.ok &&
                                (data.status === "fulfilled" || data.status === "already_fulfilled")
                            ) {
                                clearCart()
                                // Router localizado: ele acrescenta o idioma.
                                // Montar `/${locale}/...` à mão duplicaria o
                                // prefixo.
                                const purchaseId = purchaseIdRef.current ?? data.purchaseId
                                router.push(
                                    purchaseId
                                        ? `/checkout/success?purchaseId=${purchaseId}`
                                        : "/checkout/success"
                                )
                                return
                            }

                            // Não é erro assustador: o webhook resolve a
                            // compra de qualquer forma, só ainda não resolveu
                            // a tempo desta chamada.
                            toast.info(t("paddleConfirming"))
                            setIsLoading(false)
                        })
                        .catch((error) => {
                            console.error("confirm-transaction error:", error)
                            toast.info(t("paddleConfirming"))
                            setIsLoading(false)
                        })
                },
            })
            setScriptPronto(true)
        }

        if (window.Paddle) {
            inicializar()
            return
        }

        const script = document.createElement("script")
        script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
        script.async = true
        script.onload = inicializar
        script.onerror = () => console.error("Paddle.js não carregou — conferir o CSP")
        document.body.appendChild(script)
        // clearCart e t ficam de fora de propósito: o efeito só deve rodar de
        // novo quando o token ou o router mudarem — o guard `inicializado`
        // já impede reinicializar o Paddle.js, e incluir funções que mudam de
        // referência a cada render reabriria essa corrida.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientToken, router])

    if (!clientToken) {
        // Provedor desconfigurado some da tela; o aviso de "nenhum provedor" é
        // responsabilidade da página de checkout.
        return null
    }

    async function handleClick() {
        setIsLoading(true)
        try {
            const response = await fetch("/api/checkout/paddle/create-transaction", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, currency }),
            })

            const data = (await response.json()) as CreateTransactionResponse

            if (!response.ok || !data.transactionId) {
                console.error("create-transaction failed:", response.status, data.error)

                if (response.status === 401 || response.status === 403) {
                    toast.error(t("sessionExpiredPay"))
                    plainRouter.push(`/sign-in?redirect=/checkout&lang=${locale}`)
                } else {
                    toast.error(t("createFailed"))
                }
                setIsLoading(false)
                return
            }

            purchaseIdRef.current = data.purchaseId ?? null
            window.Paddle?.Checkout.open({ transactionId: data.transactionId })
            // O overlay assume a tela; o loading sai para o botão não ficar
            // travado se o comprador fechar o overlay sem pagar.
            setIsLoading(false)
        } catch (error) {
            console.error("create-transaction error:", error)
            toast.error(t("createFailed"))
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-3">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                {t("paddleTaxNotice")}
            </div>

            <Button
                type="button"
                className="h-[45px] w-full"
                disabled={isLoading || !scriptPronto}
                onClick={handleClick}
            >
                {isLoading || !scriptPronto ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                )}
                {t("payWithPaddle")}
            </Button>
        </div>
    )
}
