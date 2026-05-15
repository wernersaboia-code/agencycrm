"use client"

import { useRouter } from "next/navigation"
import { ShoppingBag, Sparkles } from "lucide-react"
import { EmptyState } from "@/components/common/empty-state"

export function PurchasesEmptyState() {
    const router = useRouter()

    return (
        <EmptyState
            icon={ShoppingBag}
            title="Nenhuma compra ainda"
            description="Explore nosso catálogo e encontre as melhores listas de leads para impulsionar seu negócio"
            primaryAction={{
                label: "Explorar Catálogo",
                onClick: () => router.push("/catalog"),
                icon: Sparkles,
            }}
        />
    )
}
