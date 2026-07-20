"use client"

// eslint-disable-next-line no-restricted-imports -- usos restantes são /dashboard, /super-admin, /sign-in, fora do segmento de locale
import Link from "next/link"
import { toast } from "sonner"
import { LayoutDashboard, LogOut, Menu, ShieldCheck, ShoppingBag, User } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Link as LocaleLink, useRouter } from "@/lib/i18n/navigation"
import { Button } from "@/components/ui/button"
import { CartBadge } from "@/components/marketplace/cart-badge"
import { LocaleSwitcher } from "@/components/marketplace/locale-switcher"
import { ThemeToggle } from "@/components/marketplace/theme-toggle"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import {
    Sheet,
    SheetClose,
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
    const { isAuthenticated, isLoading, isAdmin } = useAuth()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const router = useRouter()
    const t = useTranslations("nav")
    const locale = useLocale()

    // O id da âncora ainda não tem tradução para todos os locales; a rota em
    // si (que carrega o prefixo de idioma) vem do wrapper de navegação.
    const howItWorksAnchor = locale === "de" ? "ablauf" : "como-funciona"
    const howItWorksHref = `/#${howItWorksAnchor}`

    const handleSignOut = async () => {
        const supabase = createClient()

        await supabase.auth.signOut()
        toast.success(t("signOutSuccess"))
        router.push("/")
        router.refresh()
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <LocaleLink href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                        <span className="text-sm font-bold text-primary-foreground">EP</span>
                    </div>
                    <span className="hidden text-xl font-bold sm:block">Easy Prospect</span>
                </LocaleLink>

                <nav className="hidden items-center gap-6 md:flex">
                    <LocaleLink
                        href="/catalog"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        {t("catalog")}
                    </LocaleLink>
                    <LocaleLink
                        href={howItWorksHref}
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        {t("howItWorks")}
                    </LocaleLink>
                    <LocaleLink
                        href="/faq"
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        {t("faq")}
                    </LocaleLink>
                </nav>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <LocaleSwitcher />
                    <CartBadge />

                    {!isLoading && (
                        <>
                            {isAuthenticated ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <User className="h-4 w-4" />
                                            {t("myAccount")}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem asChild>
                                            <LocaleLink href="/my-purchases" className="cursor-pointer">
                                                <ShoppingBag className="h-4 w-4 mr-2" />
                                                {t("myPurchases")}
                                            </LocaleLink>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard" className="cursor-pointer">
                                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                                {t("accessCrm")}
                                            </Link>
                                        </DropdownMenuItem>
                                        {isAdmin && (
                                            <DropdownMenuItem asChild>
                                                <Link href="/super-admin" className="cursor-pointer">
                                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                                    {t("adminArea")}
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleSignOut}
                                            className="cursor-pointer text-red-600"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            {t("signOut")}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/sign-in">
                                        <User className="h-4 w-4" />
                                        {t("login")}
                                    </Link>
                                </Button>
                            )}
                        </>
                    )}

                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden" aria-label={t("openMenu")}>
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <nav className="mt-8 flex flex-col gap-4">
                                <SheetClose asChild>
                                    <LocaleLink href="/catalog" className="text-lg font-medium">
                                        {t("catalog")}
                                    </LocaleLink>
                                </SheetClose>
                                <SheetClose asChild>
                                    <LocaleLink href={howItWorksHref} className="text-lg font-medium">
                                        {t("howItWorks")}
                                    </LocaleLink>
                                </SheetClose>
                                <SheetClose asChild>
                                    <LocaleLink href="/faq" className="text-lg font-medium">
                                        {t("faq")}
                                    </LocaleLink>
                                </SheetClose>
                                {isAuthenticated && (
                                    <>
                                        <hr />
                                        <SheetClose asChild>
                                            <LocaleLink href="/my-purchases" className="text-lg font-medium">
                                                {t("myPurchases")}
                                            </LocaleLink>
                                        </SheetClose>
                                        <SheetClose asChild>
                                            <Link href="/dashboard" className="text-lg font-medium">
                                                {t("accessCrm")}
                                            </Link>
                                        </SheetClose>
                                        {isAdmin && (
                                            <SheetClose asChild>
                                                <Link href="/super-admin" className="text-lg font-medium">
                                                    {t("adminArea")}
                                                </Link>
                                            </SheetClose>
                                        )}
                                        <hr />
                                        <button
                                            onClick={handleSignOut}
                                            className="text-left text-lg font-medium text-red-600"
                                        >
                                            {t("signOut")}
                                        </button>
                                    </>
                                )}
                                {!isAuthenticated && (
                                    <>
                                        <hr />
                                        <SheetClose asChild>
                                            <Link href="/sign-in" className="text-lg font-medium">
                                                {t("login")}
                                            </Link>
                                        </SheetClose>
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
