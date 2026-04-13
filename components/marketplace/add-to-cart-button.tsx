// components/marketplace/add-to-cart-button.tsx
"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"

interface AddToCartButtonProps {
    list: {
        id: string
        name: string
        slug: string
        price: number
        currency: string
        totalLeads: number
    }
}

export function AddToCartButton({ list }: AddToCartButtonProps) {
    const { addItem } = useCart()

    const handleAddToCart = () => {
        addItem({
            id: list.id,
            name: list.name,
            slug: list.slug,
            price: list.price,
            currency: list.currency,
            totalLeads: list.totalLeads,
        })
    }

    return (
        <Button
            className="w-full"
            size="lg"
            variant="outline"
            onClick={handleAddToCart}
        >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Adicionar ao Carrinho
        </Button>
    )
}