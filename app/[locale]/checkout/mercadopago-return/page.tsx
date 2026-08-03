// app/[locale]/checkout/mercadopago-return/page.tsx
"use client"

import { Suspense, useEffect, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports -- usado só para /sign-in, fora do segmento de locale
import { useRouter as usePlainRouter, useSearchParams } from "next/navigation"
import { Link, useRouter } from "@/lib/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { AlertCircle, Clock, Loader2 } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"

type ConfirmResponse = {
    success?: boolean
    pending?: boolean
    purchaseId?: string
    error?: string
}

type Estado = "confirmando" | "pendente" | "falhou"

function MercadoPagoReturnContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const plainRouter = usePlainRouter()
    const { clearCart } = useCart()
    const t = useTranslations("checkout")
    const locale = useLocale()

    // O Mercado Pago devolve external_reference (nosso purchase.id) e
    // payment_id nas back_urls.
    const purchaseId = searchParams.get("external_reference")
    const paymentId = searchParams.get("payment_id")

    const [estado, setEstado] = useState<Estado>(() =>
        purchaseId ? "confirmando" : "falhou"
    )
    const startedRef = useRef(false)

    useEffect(() => {
        // StrictMode roda o efeito duas vezes em dev. O endpoint é idempotente,
        // mas evitamos a chamada dupla visível.
        if (startedRef.current || !purchaseId) {
            return
        }
        startedRef.current = true

        async function confirm(id: string) {
            try {
                const response = await fetch("/api/checkout/mercadopago/confirm-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        purchaseId: id,
                        ...(paymentId ? { paymentId } : {}),
                    }),
                })

                const result = (await response.json()) as ConfirmResponse

                if (response.status === 401 || response.status === 403) {
                    toast.error(t("sessionExpiredOrder"))
                    plainRouter.push(`/sign-in?redirect=/my-purchases&lang=${locale}`)
                    return
                }

                // 202: o Pix ainda não caiu. Não é erro — o webhook efetiva e o
                // e-mail chega quando o banco confirmar.
                if (response.status === 202 || result.pending) {
                    clearCart()
                    setEstado("pendente")
                    return
                }

                if (!response.ok || !result.purchaseId) {
                    console.error("confirm-payment failed:", response.status, result.error)
                    setEstado("falhou")
                    return
                }

                clearCart()
                toast.success(t("paymentConfirmed"))
                router.push(`/checkout/success?purchaseId=${result.purchaseId}`)
            } catch (error) {
                console.error("confirm-payment error:", error)
                setEstado("falhou")
            }
        }

        confirm(purchaseId)
    }, [purchaseId, paymentId, router, plainRouter, clearCart, t, locale])

    if (estado === "pendente") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
                <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center">
                    <Clock className="mx-auto mb-4 h-10 w-10 text-amber-600" aria-hidden="true" />
                    <p className="mb-6 text-muted-foreground">{t("mpPending")}</p>
                    <Button asChild>
                        <Link href="/my-purchases">{t("successCtaPurchases")}</Link>
                    </Button>
                </div>
            </div>
        )
    }

    if (estado === "falhou") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
                <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center">
                    <AlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-600" aria-hidden="true" />
                    <p className="mb-6 text-muted-foreground">{t("mpConfirmFailed")}</p>
                    <Button asChild>
                        <Link href="/my-purchases">{t("successCtaPurchases")}</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                {t("mpConfirming")}
            </div>
        </div>
    )
}

export default function MercadoPagoReturnPage() {
    return (
        <Suspense>
            <MercadoPagoReturnContent />
        </Suspense>
    )
}
