// components/marketplace/marketplace-header.tsx
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, Menu, ShoppingBag, LogOut } from "lucide-react"
import { CartBadge } from "@/components/marketplace/cart-badge"
import { useAuth } from "@/hooks/useAuth"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function MarketplaceHeader() {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    const handleSignOut = async () => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        await supabase.auth.signOut()
        toast.success("Logout realizado com sucesso")
        router.push("/")
        router.refresh()
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">L</span>
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
                    {isAuthenticated && (
                        <Link
                            href="/my-purchases"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Minhas Compras
                        </Link>
                    )}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Cart Badge */}
                    <CartBadge />

                    {/* Auth Actions */}
                    {!isLoading && (
                        <>
                            {isAuthenticated ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <User className="h-4 w-4 mr-2" />
                                            Minha Conta
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem asChild>
                                            <Link href="/my-purchases" className="cursor-pointer">
                                                <ShoppingBag className="h-4 w-4 mr-2" />
                                                Minhas Compras
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard" className="cursor-pointer">
                                                <User className="h-4 w-4 mr-2" />
                                                Acessar CRM
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleSignOut}
                                            className="cursor-pointer text-red-600"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Sair
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/sign-in?from=marketplace">
                                        <User className="h-4 w-4 mr-2" />
                                        Entrar
                                    </Link>
                                </Button>
                            )}
                        </>
                    )}

                    {/* Mobile Menu */}
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
                                {isAuthenticated && (
                                    <>
                                        <hr />
                                        <Link href="/my-purchases" className="text-lg font-medium">
                                            Minhas Compras
                                        </Link>
                                        <Link href="/dashboard" className="text-lg font-medium">
                                            Acessar CRM
                                        </Link>
                                        <hr />
                                        <button
                                            onClick={handleSignOut}
                                            className="text-lg font-medium text-left text-red-600"
                                        >
                                            Sair
                                        </button>
                                    </>
                                )}
                                {!isAuthenticated && (
                                    <>
                                        <hr />
                                        <Link href="/sign-in?from=marketplace" className="text-lg font-medium">
                                            Entrar
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}