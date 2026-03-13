// components/marketplace/marketplace-header.tsx
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingCart, User, Menu } from "lucide-react"
import { useState } from "react"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"

export function MarketplaceHeader() {
    const [cartCount] = useState(0)

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">E</span>
                    </div>
                    <span className="font-bold text-xl hidden sm:block">Easy Prospect</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    <Link
                        href="/catalog"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Catálogo
                    </Link>
                    <Link
                        href="/#como-funciona"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Como Funciona
                    </Link>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="relative">
                        <ShoppingCart className="h-5 w-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">
                {cartCount}
              </span>
                        )}
                    </Button>

                    <Button variant="outline" size="sm" asChild>
                        <Link href="/sign-in">Entrar</Link>
                    </Button>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <nav className="flex flex-col gap-4 mt-8">
                                <Link href="/catalog" className="text-lg font-medium">
                                    Catálogo
                                </Link>
                                <Link href="/#como-funciona" className="text-lg font-medium">
                                    Como Funciona
                                </Link>
                                <hr />
                                <Link href="/sign-in" className="text-lg font-medium">
                                    Entrar
                                </Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}