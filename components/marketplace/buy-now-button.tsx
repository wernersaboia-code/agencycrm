// components/marketplace/buy-now-button.tsx
"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface BuyNowButtonProps {
    list: {
        id: string
        name: string
        slug: string
        price: number
        currency: string
        totalLeads: number
    }
}

export function BuyNowButton({ list }: BuyNowButtonProps) {
    const router = useRouter()

    const handleBuyNow = () => {
        // TODO: Verificar autenticação
        // TODO: Criar purchase no backend
        // TODO: Redirecionar para checkout
        toast.success(`"${list.name}" - Indo para checkout...`)
        router.push(`/checkout?listId=${list.id}`)
    }

    return (
        <Button
            className="w-full h-12 text-lg font-semibold bg-[#4a2c5a] hover:bg-[#5d3a70]"
            size="lg"
            onClick={handleBuyNow}
        >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Comprar Agora
        </Button>
    )
}