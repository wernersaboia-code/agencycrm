// components/marketplace/cart-badge.tsx
"use client"

import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function CartBadge() {
    const { itemCount, openCart } = useCart()

    return (
        <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={openCart}
        >
            <ShoppingCart className="h-5 w-5" />
            <AnimatePresence>
                {itemCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#2ec4b6] text-white text-xs flex items-center justify-center font-semibold shadow-lg"
                    >
                        {itemCount > 9 ? "9+" : itemCount}
                    </motion.span>
                )}
            </AnimatePresence>
        </Button>
    )
}