"use client"

import { useRouter } from "@/lib/i18n/navigation"
import { useTranslations } from "next-intl"
import { ShoppingBag } from "lucide-react"
import { EmptyState } from "@/components/common/empty-state"

export function MyPurchasesEmptyState() {
    const router = useRouter()
    const t = useTranslations("purchases")

    return (
        <EmptyState
            icon={ShoppingBag}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            primaryAction={{
                label: t("emptyCta"),
                onClick: () => router.push("/catalog"),
            }}
        />
    )
}
