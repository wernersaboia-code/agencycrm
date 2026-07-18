// components/marketplace/cart-item.tsx
"use client"

import { useCart, CartItem as CartItemType } from "@/contexts/cart-context"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Trash2, Building2, Users } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

interface CartItemProps {
    item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
    const { removeItem } = useCart()
    const t = useTranslations("cart")

    return (
        <div className="flex gap-4 p-4 bg-card rounded-lg border border-border hover:border-brand-accent transition-colors">
            {/* Icon */}
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-8 w-8 text-white" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <Link
                    href={`/list/${item.slug}`}
                    className="font-semibold text-foreground hover:text-brand-accent-strong transition-colors line-clamp-2 block mb-1"
                >
                    {item.name}
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{t("leads", { count: item.totalLeads })}</span>
                </div>
                <div className="mt-2 font-bold text-brand">
                    {formatCurrency(item.price, item.currency)}
                </div>
            </div>

            {/* Remove Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                aria-label={t("removeItem", { name: item.name })}
                className="flex-shrink-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
            >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
        </div>
    )
}