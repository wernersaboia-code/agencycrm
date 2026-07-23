"use client"

import { useEffect, useMemo, useState } from "react"
import type { ComponentType, FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, CheckCircle2, Loader2, ShieldCheck, ShoppingBag } from "lucide-react"
import { toast } from "sonner"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import {
    getAreaFromRedirect,
    normalizeRedirect,
    resolvePostLoginRedirect,
    type AccessAreaId,
} from "@/lib/auth/access-areas"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales"
import { cn } from "@/lib/utils"

// Só os campos estruturais ficam aqui; título/descrição/botão vêm das
// traduções por id (auth.signIn.areas.<id>). `visivel` controla se aparece na
// lista de escolha — o CRM é interno, resolve como destino mas não é ofertado.
type AccessArea = {
    id: AccessAreaId
    redirect: string
    icon: ComponentType<{ className?: string }>
    visivel: boolean
}

const accessAreas: AccessArea[] = [
    { id: "purchases", redirect: "/my-purchases", icon: ShoppingBag, visivel: true },
    { id: "admin", redirect: "/super-admin", icon: ShieldCheck, visivel: true },
    { id: "crm", redirect: "/dashboard", icon: Building2, visivel: false },
]

const areasVisiveis = accessAreas.filter((area) => area.visivel)

export function SignInForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const t = useTranslations("auth")
    const locale = useLocale() as Locale
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const explicitRedirect = searchParams.get("redirect")
    const selectedAreaId = getAreaFromRedirect(explicitRedirect, searchParams.get("from"))
    const selectedArea = useMemo(
        () => accessAreas.find((area) => area.id === selectedAreaId) ?? accessAreas[0],
        [selectedAreaId]
    )
    const SelectedIcon = selectedArea.icon

    // Card leva a /sign-in?redirect=... preservando o idioma atual (senão o
    // clique reiniciaria a tela em pt).
    const cardHref = (redirect: string) => {
        const params = new URLSearchParams({ redirect })
        if (locale !== DEFAULT_LOCALE) params.set("lang", locale)
        return `/sign-in?${params.toString()}`
    }

    const signUpHref = locale !== DEFAULT_LOCALE ? `/sign-up?lang=${locale}` : "/sign-up"

    const erro = searchParams.get("erro")
    useEffect(() => {
        if (!erro) return

        const mensagens: Record<string, string> = {
            link_expirado: t("signIn.errLinkExpired"),
            link_invalido: t("signIn.errLinkInvalid"),
            link_incompleto: t("signIn.errLinkIncomplete"),
        }

        toast.error(mensagens[erro] ?? t("signIn.errGeneric"))
    }, [erro, t])

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        try {
            const supabase = createClient()

            const { error } = await supabase.auth.signInWithPassword({ email, password })

            if (error) {
                toast.error(error.message)
                return
            }

            const intended = explicitRedirect
                ? normalizeRedirect(explicitRedirect)
                : selectedArea.redirect

            let role: string | null = null
            try {
                const response = await fetch("/api/user/role")
                if (response.ok) {
                    role = (await response.json()).role ?? null
                }
            } catch {
                // Sem o papel, resolvePostLoginRedirect escolhe o destino seguro.
            }

            const redirectTo = resolvePostLoginRedirect(intended, role)

            toast.success(t("signIn.success"))
            router.push(redirectTo)
            router.refresh()
        } catch {
            toast.error(t("signIn.error"))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
            <section className="rounded-lg border border-border bg-card p-5 shadow-[0_1px_2px_rgba(20,40,36,0.04)]">
                <div className="mb-5">
                    <p className="text-sm font-bold uppercase text-primary">
                        {t("signIn.chooseHeading")}
                    </p>
                    <h1 className="mt-2 text-2xl font-bold tracking-normal text-foreground">
                        {t("signIn.mainAccess")}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {t("signIn.chooseHelp")}
                    </p>
                </div>

                <div className="grid gap-3">
                    {areasVisiveis.map((area) => {
                        const Icon = area.icon
                        const isSelected = area.id === selectedArea.id

                        return (
                            <Link
                                key={area.id}
                                href={cardHref(area.redirect)}
                                className={cn(
                                    "flex gap-4 rounded-lg border p-4 transition hover:border-primary/30 hover:bg-secondary/60",
                                    isSelected ? "border-primary bg-secondary" : "border-border bg-card"
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-md",
                                        isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-semibold text-foreground">{t(`signIn.areas.${area.id}.title`)}</h2>
                                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                    </div>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        {t(`signIn.areas.${area.id}.description`)}
                                    </p>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </section>

            <Card className="w-full rounded-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-md bg-primary">
                            <SelectedIcon className="h-8 w-8 text-primary-foreground" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {t(`signIn.areas.${selectedArea.id}.shortTitle`)}
                    </CardTitle>
                    <CardDescription>{t("signIn.cardDescription")}</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">{t("signIn.emailLabel")}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={t("signIn.emailPlaceholder")}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{t("signIn.passwordLabel")}</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder={t("signIn.passwordPlaceholder")}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {t(`signIn.areas.${selectedArea.id}.button`)}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            {t("signIn.noAccount")}{" "}
                            <Link href={signUpHref} className="text-primary hover:underline">
                                {t("signIn.createAccount")}
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
