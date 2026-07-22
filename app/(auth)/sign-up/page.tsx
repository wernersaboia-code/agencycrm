// app/(auth)/sign-up/page.tsx.bak
"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, ShoppingBag, Building2, CheckCircle, Mail } from "lucide-react"

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

function SignUpForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)

    // Detectar contexto (marketplace vs crm)
    const from = searchParams.get("from")
    const isMarketplace = from === "marketplace"

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        try {
            const supabase = createClient()

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        source: isMarketplace ? "marketplace" : "crm",
                    },
                    // Precisa passar pelo callback: é lá que o código do
                    // e-mail vira sessão. Apontar direto para a página final
                    // deixa o código sem trocar e a conta sem confirmar.
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
                        isMarketplace ? "/my-purchases" : "/dashboard"
                    )}`,
                },
            })

            if (error) {
                toast.error(error.message)
                return
            }

            setIsSuccess(true)
            toast.success("Conta criada com sucesso!")
        } catch {
            toast.error("Erro ao criar conta")
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-12 w-12 text-indigo-600" />
                    </div>

                    <CardTitle className="text-2xl font-bold">
                        Conta criada com sucesso! 🎉
                    </CardTitle>

                    <CardDescription>
                        Enviamos um email de verificação para:
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-center gap-2">
                            <Mail className="h-5 w-5 text-[#2ec4b6]" />
                            <span className="font-medium text-gray-800">{email}</span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-brand-accent/40 bg-brand-accent/10 p-4">
                        <h3 className="mb-2 font-medium text-foreground">Próximos passos</h3>
                        <ol className="space-y-2 text-sm text-muted-foreground">
                            <li>1. Abra seu e-mail e clique no link de confirmação.</li>
                            <li>
                                2. Você entra direto{" "}
                                {isMarketplace ? "nas suas compras" : "no CRM"} pelo link.
                            </li>
                            <li>3. Nos próximos acessos, use este e-mail e a senha que acabou de criar.</li>
                        </ol>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        className={`w-full ${isMarketplace ? 'bg-[#4a2c5a] hover:bg-[#5d3a70]' : ''}`}
                        onClick={() => router.push(isMarketplace ? '/catalog' : '/dashboard')}
                    >
                        {isMarketplace ? "Explorar Catálogo" : "Ir para Dashboard"}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                        Não recebeu o email? Verifique a pasta de spam
                    </p>
                </CardFooter>
            </Card>
        )
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
                    {isMarketplace ? "Criar Conta - Easy Prospect" : "Criar conta no CRM"}
                </CardTitle>
                <CardDescription>
                    {isMarketplace
                        ? "Crie sua conta para acessar suas compras"
                        : "Preencha os dados abaixo para criar sua conta"
                    }
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Seu nome"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
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
                            minLength={6}
                            disabled={isLoading}
                        />
                    </div>

                    {isMarketplace && (
                        <div className="bg-gradient-to-r from-[#4a2c5a]/5 to-[#2ec4b6]/5 rounded-lg p-4 border border-[#2ec4b6]/20">
                            <h3 className="font-medium text-gray-800 mb-2">✨ Benefícios:</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>✓ Acesso vitalício às listas compradas</li>
                                <li>✓ Downloads ilimitados em CSV e Excel</li>
                                <li>✓ Links mágicos no email (sem decorar senha)</li>
                                <li>✓ CRM gratuito opcional</li>
                            </ul>
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
                        {isMarketplace ? "Criar Conta e Continuar" : "Criar conta"}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                        Já tem uma conta?{" "}
                        <Link
                            href={`/sign-in${isMarketplace ? '?from=marketplace' : ''}`}
                            className="text-primary hover:underline"
                        >
                            Entrar
                        </Link>
                    </p>

                    {!isMarketplace && (
                        <div className="text-center">
                            <Link
                                href="/sign-up?from=marketplace"
                                className="text-sm text-[#2ec4b6] hover:underline"
                            >
                                ← Criar conta para compras
                            </Link>
                        </div>
                    )}
                </CardFooter>
            </form>
        </Card>
    )
}

export default function SignUpPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <SignUpForm />
        </Suspense>
    )
}
