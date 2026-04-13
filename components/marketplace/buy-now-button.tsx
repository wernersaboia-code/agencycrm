// components/marketplace/buy-now-button.tsx
"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
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
    const { addItem } = useCart()
    const router = useRouter()

    const handleBuyNow = () => {
        addItem({
            id: list.id,
            name: list.name,
            slug: list.slug,
            price: list.price,
            currency: list.currency,
            totalLeads: list.totalLeads,
        })

        // Redirecionar para checkout
        router.push("/checkout")
    }

    return (
        <Button
            className="w-full bg-[#4a2c5a] hover:bg-[#3a1c4a]"
            size="lg"
            onClick={handleBuyNow}
        >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Comprar Agora
        </Button>
    )
}