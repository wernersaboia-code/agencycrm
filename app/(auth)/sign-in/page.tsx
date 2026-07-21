"use client"

import { Suspense, useMemo, useState } from "react"
import type { ComponentType, FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, CheckCircle2, Loader2, ShieldCheck, ShoppingBag } from "lucide-react"
import { toast } from "sonner"

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
import { cn } from "@/lib/utils"

type AccessArea = {
    id: AccessAreaId
    title: string
    shortTitle: string
    description: string
    redirect: string
    signInHref: string
    buttonLabel: string
    icon: ComponentType<{ className?: string }>
}

const accessAreas: AccessArea[] = [
    {
        id: "admin",
        title: "Área Administrativa",
        shortTitle: "Área Administrativa",
        description: "Gerenciar listas, usuários, vendas e configurações.",
        redirect: "/super-admin",
        signInHref: "/sign-in?redirect=/super-admin",
        buttonLabel: "Entrar na Área Administrativa",
        icon: ShieldCheck,
    },
    {
        id: "crm",
        title: "CRM",
        shortTitle: "Entrar no CRM",
        description: "Leads, campanhas, chamadas, relatórios e rotina comercial.",
        redirect: "/dashboard",
        signInHref: "/sign-in?redirect=/dashboard",
        buttonLabel: "Entrar no CRM",
        icon: Building2,
    },
    {
        id: "purchases",
        title: "Minhas compras",
        shortTitle: "Ver compras",
        description: "Listas compradas, pedidos e downloads de arquivos.",
        redirect: "/my-purchases",
        signInHref: "/sign-in?redirect=/my-purchases",
        buttonLabel: "Entrar em Minhas compras",
        icon: ShoppingBag,
    },
]

function SignInForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
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

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        try {
            const supabase = createClient()

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                toast.error(error.message)
                return
            }

            const intended = explicitRedirect
                ? normalizeRedirect(explicitRedirect)
                : selectedArea.redirect

            // A área é escolhida antes de sabermos quem entrou. Conferir o
            // papel agora evita despachar a pessoa para um destino que o
            // layout de lá devolveria — de onde ela voltaria ao login sem
            // nenhuma mensagem, parecendo que o botão não funcionou.
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

            toast.success("Login realizado com sucesso!")
            router.push(redirectTo)
            router.refresh()
        } catch {
            toast.error("Erro ao fazer login")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
            <section className="rounded-lg border border-border bg-card p-5 shadow-[0_1px_2px_rgba(20,40,36,0.04)]">
                <div className="mb-5">
                    <p className="text-sm font-bold uppercase text-primary">
                        Escolha para onde entrar
                    </p>
                    <h1 className="mt-2 text-2xl font-bold tracking-normal text-foreground">
                        Acessos principais
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        A Área Administrativa aparece primeiro para facilitar a rotina de quem trabalha no sistema.
                        CRM e compras continuam separados logo abaixo.
                    </p>
                </div>

                <div className="grid gap-3">
                    {accessAreas.map((area) => {
                        const Icon = area.icon
                        const isSelected = area.id === selectedArea.id

                        return (
                            <Link
                                key={area.id}
                                href={area.signInHref}
                                className={cn(
                                    "flex gap-4 rounded-lg border p-4 transition hover:border-primary/30 hover:bg-secondary/60",
                                    isSelected
                                        ? "border-primary bg-secondary"
                                        : "border-border bg-card"
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-md",
                                        isSelected
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-secondary text-muted-foreground"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-semibold text-foreground">{area.title}</h2>
                                        {isSelected && (
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        {area.description}
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
                        {selectedArea.shortTitle}
                    </CardTitle>
                    <CardDescription>
                        Digite seu email e senha para acessar esta área.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {selectedArea.buttonLabel}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            Não tem uma conta?{" "}
                            <Link href="/sign-up" className="text-primary hover:underline">
                                Criar conta
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

export default function SignInPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
        >
            <SignInForm />
        </Suspense>
    )
}
