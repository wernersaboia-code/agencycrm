// app/(auth)/sign-in/page.tsx.bak
"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, ShoppingBag, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { createClient } from "@/lib/supabase/client"

function SignInForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // Detectar contexto (marketplace vs crm)
    const from = searchParams.get("from")
    const redirectTo = searchParams.get("redirect") || (from === "marketplace" ? "/my-purchases" : "/dashboard")
    const isMarketplace = from === "marketplace" || searchParams.get("marketplace") === "true"

    async function handleSubmit(e: React.FormEvent) {
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

            toast.success("Login realizado com sucesso!")
            router.push(redirectTo)
            router.refresh()
        } catch (error) {
            toast.error("Erro ao fazer login")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                    {isMarketplace ? (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4a2c5a] to-[#5d3a70] flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-white" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                    )}
                </div>
                <CardTitle className="text-2xl font-bold">
                    {isMarketplace ? "Acessar Minhas Compras" : "Acessar CRM"}
                </CardTitle>
                <CardDescription>
                    {isMarketplace
                        ? "Entre para acessar suas listas de leads compradas"
                        : "Digite seu email e senha para acessar sua conta"
                    }
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
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {isMarketplace && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>💡 Dica:</strong> Você também pode usar o link mágico
                                enviado no email de confirmação da sua compra!
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className={`w-full ${isMarketplace ? 'bg-[#4a2c5a] hover:bg-[#5d3a70]' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isMarketplace ? "Entrar e Ver Compras" : "Entrar no CRM"}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                        Não tem uma conta?{" "}
                        <Link
                            href={`/sign-up${isMarketplace ? '?from=marketplace' : ''}`}
                            className="text-primary hover:underline"
                        >
                            Criar conta
                        </Link>
                    </p>

                    {!isMarketplace && (
                        <div className="text-center">
                            <Link
                                href="/sign-in?from=marketplace"
                                className="text-sm text-[#2ec4b6] hover:underline"
                            >
                                ← Acessar área de compras
                            </Link>
                        </div>
                    )}
                </CardFooter>
            </form>
        </Card>
    )
}

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <SignInForm />
        </Suspense>
    )
}