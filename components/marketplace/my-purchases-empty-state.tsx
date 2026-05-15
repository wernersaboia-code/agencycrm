"use client"

import { useRouter } from "next/navigation"
import { ShoppingBag } from "lucide-react"
import { EmptyState } from "@/components/common/empty-state"

export function MyPurchasesEmptyState() {
    const router = useRouter()

    return (
        <EmptyState
            icon={ShoppingBag}
            title="Nenhuma compra ainda"
            description="Explore o catálogo, selecione uma base compatível com sua campanha e volte aqui para baixar os arquivos."
            primaryAction={{
                label: "Explorar catálogo",
                onClick: () => router.push("/catalog"),
            }}
        />
    )
}
