// components/admin/purchase-test-toggle.tsx
"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { FlaskConical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { marcarCompraDeTeste } from "@/actions/admin/purchases"

/** Marca a compra como teste (fora das métricas) ou devolve ela às vendas reais. */
export function PurchaseTestToggle({ purchaseId, isTest }: { purchaseId: string; isTest: boolean }) {
    const t = useTranslations("admin.purchases")
    const router = useRouter()
    const [pendente, startTransition] = useTransition()

    const alternar = () => {
        startTransition(async () => {
            try {
                const resultado = await marcarCompraDeTeste(purchaseId, !isTest)
                if (!resultado.success) {
                    toast.error(resultado.error)
                    return
                }
                toast.success(isTest ? t("testUnmarked") : t("testMarked"))
                router.refresh()
            } catch {
                toast.error(t("testToggleError"))
            }
        })
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            disabled={pendente}
            onClick={alternar}
            title={isTest ? t("unmarkTestHint") : t("markTestHint")}
            className="text-xs text-muted-foreground"
        >
            <FlaskConical className="h-3.5 w-3.5" />
            {isTest ? t("unmarkTest") : t("markTest")}
        </Button>
    )
}
