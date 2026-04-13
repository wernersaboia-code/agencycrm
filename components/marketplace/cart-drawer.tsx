// components/marketplace/cart-drawer.tsx
"use client"

import { useCart } from "@/contexts/cart-context"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { X, ShoppingBag, ArrowRight } from "lucide-react"
import Link from "next/link"
import { CartItem } from "./cart-item"

export function CartDrawer() {
    const { items, isOpen, closeCart, total, itemCount } = useCart()

    return (
        <Sheet open={isOpen} onOpenChange={closeCart}>
            <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
                {/* Header */}
                <SheetHeader className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-[#2ec4b6]" />
                            Seu Carrinho
                            {itemCount > 0 && (
                                <span className="text-sm font-normal text-muted-foreground">
                  ({itemCount} {itemCount === 1 ? "item" : "itens"})
                </span>
                            )}
                        </SheetTitle>
                    </div>
                </SheetHeader>

                {/* Items */}
                <ScrollArea className="flex-1 px-6">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <ShoppingBag className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2">
                                Seu carrinho está vazio
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Adicione listas de leads para começar
                            </p>
                            <Button asChild onClick={closeCart}>
                                <Link href="/catalog">Ver Catálogo</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="py-4 space-y-4">
                            {items.map((item) => (
                                <CartItem key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t px-6 py-4 space-y-4 bg-gray-50">
                        {/* Subtotal */}
                        <div className="flex items-center justify-between text-lg font-semibold">
                            <span className="text-gray-700">Subtotal</span>
                            <span className="text-[#4a2c5a]">
                {formatCurrency(total, items[0]?.currency || "EUR")}
              </span>
                        </div>

                        <Separator />

                        {/* Buttons */}
                        <div className="space-y-2">
                            <Button
                                className="w-full h-12 text-base bg-[#4a2c5a] hover:bg-[#3a1c4a]"
                                asChild
                                onClick={closeCart}
                            >
                                <Link href="/cart">
                                    Finalizar Compra
                                    <ArrowRight className="h-5 w-5 ml-2" />
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                asChild
                                onClick={closeCart}
                            >
                                <Link href="/catalog">Continuar Comprando</Link>
                            </Button>
                        </div>

                        {/* Secure Badge */}
                        <p className="text-xs text-center text-muted-foreground">
                            🔒 Pagamento seguro via PayPal
                        </p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}