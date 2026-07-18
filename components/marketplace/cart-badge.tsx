// components/marketplace/cart-badge.tsx
"use client"

import { useCart } from "@/contexts/cart-context"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function CartBadge() {
    const { itemCount, openCart } = useCart()
    const t = useTranslations("cart")

    return (
        <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={openCart}
            aria-label={
                itemCount > 0
                    ? t("openCartWithItems", { count: itemCount })
                    : t("openCart")
            }
        >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />

            <AnimatePresence>
                {itemCount > 0 && (
                    <motion.span
                        key={itemCount}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        aria-hidden="true"
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-semibold shadow-lg"
                    >
                        {itemCount > 9 ? "9+" : itemCount}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* O contador visual é `aria-hidden` (mostra "9+"); esta região
                anuncia a contagem real quando o carrinho muda. */}
            <span role="status" aria-live="polite" className="sr-only">
                {itemCount > 0 ? t("items", { count: itemCount }) : ""}
            </span>
        </Button>
    )
}
