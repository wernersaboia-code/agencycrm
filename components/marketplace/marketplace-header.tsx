"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { LayoutDashboard, LogOut, Menu, ShoppingBag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CartBadge } from "@/components/marketplace/cart-badge"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
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
        const supabase = createClient()

        await supabase.auth.signOut()
        toast.success("Logout realizado com sucesso")
        router.push("/")
        router.refresh()
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600">
                        <span className="text-lg font-bold text-white">L</span>
                    </div>
                    <span className="hidden text-xl font-bold sm:block">LeadStore</span>
                </Link>

                <nav className="hidden items-center gap-6 md:flex">
                    <Link
                        href="/catalog"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Catálogo
                    </Link>
                    <Link
                        href="/#como-funciona"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Como funciona
                    </Link>
                    <Link
                        href="/pricing"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Planos CRM
                    </Link>
                    {isAuthenticated && (
                        <Link
                            href="/my-purchases"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Minhas compras
                        </Link>
                    )}
                </nav>

                <div className="flex items-center gap-2">
                    <CartBadge />

                    {!isLoading && (
                        <>
                            {isAuthenticated ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <User className="h-4 w-4" />
                                            Minha conta
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem asChild>
                                            <Link href="/my-purchases" className="cursor-pointer">
                                                <ShoppingBag className="h-4 w-4 mr-2" />
                                                Minhas compras
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard" className="cursor-pointer">
                                                <LayoutDashboard className="h-4 w-4 mr-2" />
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
                                        <User className="h-4 w-4" />
                                        Entrar
                                    </Link>
                                </Button>
                            )}
                        </>
                    )}

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <nav className="mt-8 flex flex-col gap-4">
                                <Link href="/catalog" className="text-lg font-medium">
                                    Catálogo
                                </Link>
                                <Link href="/#como-funciona" className="text-lg font-medium">
                                    Como funciona
                                </Link>
                                <Link href="/pricing" className="text-lg font-medium">
                                    Planos CRM
                                </Link>
                                {isAuthenticated && (
                                    <>
                                        <hr />
                                        <Link href="/my-purchases" className="text-lg font-medium">
                                            Minhas compras
                                        </Link>
                                        <Link href="/dashboard" className="text-lg font-medium">
                                            Acessar CRM
                                        </Link>
                                        <hr />
                                        <button
                                            onClick={handleSignOut}
                                            className="text-left text-lg font-medium text-red-600"
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
