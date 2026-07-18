// components/marketplace/buy-now-button.tsx
"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/hooks/useAuth"
import { useTranslations } from "next-intl"
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
    const { isAuthenticated, isLoading } = useAuth()
    const t = useTranslations("listing")
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

        // O carrinho vive no localStorage, então sobrevive ao login — o item
        // continua lá quando o usuário voltar para o checkout.
        router.push(isAuthenticated ? "/checkout" : "/sign-in?redirect=/checkout")
    }

    return (
        <Button
            className="w-full bg-brand text-brand-foreground hover:bg-brand-hover"
            size="lg"
            onClick={handleBuyNow}
            disabled={isLoading}
        >
            <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
            {isAuthenticated ? t("buyNow") : t("signInToBuy")}
        </Button>
    )
}
