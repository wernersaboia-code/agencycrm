// app/[locale]/checkout/stripe-return/page.tsx
"use client"

import { Suspense, useEffect, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports -- usado só para /sign-in, fora do segmento de locale
import { useRouter as usePlainRouter, useSearchParams } from "next/navigation"
import { Link, useRouter } from "@/lib/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { AlertCircle, Loader2 } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"

type ConfirmSessionResponse = {
    success?: boolean
    purchaseId?: string
    error?: string
}

function StripeReturnContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    // /sign-in fica fora do segmento de locale — usa o router puro do Next.
    const plainRouter = usePlainRouter()
    const { clearCart } = useCart()
    const t = useTranslations("checkout")
    const locale = useLocale()
    const sessionId = searchParams.get("session_id")
    const [failed, setFailed] = useState(() => !sessionId)
    const startedRef = useRef(false)

    useEffect(() => {
        // StrictMode roda o efeito duas vezes em dev. O confirm-session é
        // idempotente no servidor, mas evitamos a chamada dupla visível.
        if (startedRef.current || !sessionId) {
            return
        }
        startedRef.current = true

        async function confirm(id: string) {
            try {
                const response = await fetch("/api/checkout/stripe/confirm-session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sessionId: id }),
                })

                const result = await response.json() as ConfirmSessionResponse

                if (!response.ok || !result.purchaseId) {
                    console.error("confirm-session failed:", response.status, result.error)

                    if (response.status === 401 || response.status === 403) {
                        toast.error(t("sessionExpiredOrder"))
                        plainRouter.push(`/sign-in?redirect=/my-purchases&lang=${locale}`)
                        return
                    }

                    // O pagamento pode ter sido aprovado no Stripe e falhado
                    // só na confirmação do nosso lado — o webhook reconcilia
                    // e a compra aparece em Minhas compras.
                    setFailed(true)
                    return
                }

                clearCart()
                toast.success(t("paymentConfirmed"))
                router.push(`/checkout/success?purchaseId=${result.purchaseId}`)
            } catch (error) {
                console.error("confirm-session error:", error)
                setFailed(true)
            }
        }

        confirm(sessionId)
    }, [sessionId, router, plainRouter, clearCart, t, locale])

    if (failed) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
                <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center">
                    <AlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-600" aria-hidden="true" />
                    <p className="mb-6 text-muted-foreground">{t("stripeConfirmFailed")}</p>
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
                {t("stripeConfirming")}
            </div>
        </div>
    )
}

export default function StripeReturnPage() {
    return (
        <Suspense>
            <StripeReturnContent />
        </Suspense>
    )
}
