// components/marketplace/cart-badge.tsx
"use client"

import { useSyncExternalStore } from "react"
import { useCart } from "@/contexts/cart-context"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Detector de montagem sem setState-em-effect (regra react-hooks/set-state-in-effect):
// o servidor e a hidratação leem `false`; depois da hidratação, `true`.
const subscribeToNothing = () => () => {}

function useMounted() {
    return useSyncExternalStore(
        subscribeToNothing,
        () => true,
        () => false
    )
}

export function CartBadge() {
    const { itemCount, openCart } = useCart()
    const t = useTranslations("cart")

    // O carrinho vive no localStorage: no servidor e na hidratação ele é
    // sempre vazio, mas o primeiro render do cliente já vê os itens — e o
    // HTML diverge (hydration mismatch). Só exibimos a contagem depois do
    // mount, quando servidor e cliente já convergiram.
    const mounted = useMounted()
    const visibleCount = mounted ? itemCount : 0

    return (
        <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={openCart}
            aria-label={
                visibleCount > 0
                    ? t("openCartWithItems", { count: visibleCount })
                    : t("openCart")
            }
        >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />

            <AnimatePresence>
                {visibleCount > 0 && (
                    <motion.span
                        key={visibleCount}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        aria-hidden="true"
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-semibold shadow-lg"
                    >
                        {visibleCount > 9 ? "9+" : visibleCount}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* O contador visual é `aria-hidden` (mostra "9+"); esta região
                anuncia a contagem real quando o carrinho muda. */}
            <span role="status" aria-live="polite" className="sr-only">
                {visibleCount > 0 ? t("items", { count: visibleCount }) : ""}
            </span>
        </Button>
    )
}
