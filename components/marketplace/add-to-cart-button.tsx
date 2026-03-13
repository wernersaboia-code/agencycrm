// components/marketplace/add-to-cart-button.tsx
"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { toast } from "sonner"

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
    const handleAddToCart = () => {
        // TODO: Implementar carrinho real
        toast.success(`"${list.name}" adicionado ao carrinho!`)
    }

    return (
        <Button className="w-full" size="lg" onClick={handleAddToCart}>
            <ShoppingCart className="h-5 w-5 mr-2" />
            Adicionar ao Carrinho
        </Button>
    )
}