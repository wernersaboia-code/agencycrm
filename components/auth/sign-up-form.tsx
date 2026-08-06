"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, ShoppingBag, CheckCircle, Mail } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

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
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales"
import { PASSWORD_MIN_LENGTH, validarSenha, type PasswordProblem } from "@/lib/auth/password-policy"

// A variante "CRM" saiu daqui: o CRM foi desabilitado para uso externo, e a
// tela de login ja tinha fechado essa porta (area `crm` com visivel: false).
// Todo cadastro e do marketplace.

const MENSAGEM_DE_SENHA: Record<PasswordProblem, string> = {
    curta: "signUp.pwdShort",
    semLetra: "signUp.pwdNoLetter",
    semNumero: "signUp.pwdNoDigit",
}

export function SignUpForm() {
    const router = useRouter()
    const t = useTranslations("auth")
    const locale = useLocale() as Locale
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [erroDeSenha, setErroDeSenha] = useState<PasswordProblem | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)

    // Preserva o idioma ao pular entre sign-up e sign-in.
    const langSuffix = locale !== DEFAULT_LOCALE ? `?lang=${locale}` : ""
    const signInHref = `/sign-in${langSuffix}`

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        // A mesma regra roda na rota. Aqui ela existe para a pessoa ler o
        // motivo no idioma dela antes de enviar — o erro do servidor volta
        // como codigo, nao como frase.
        const problema = validarSenha(password)
        if (problema) {
            setErroDeSenha(problema)
            return
        }

        setErroDeSenha(null)
        setIsLoading(true)

        try {
            const resposta = await fetch("/api/auth/sign-up", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, locale }),
            })

            if (!resposta.ok) {
                const corpo = await resposta.json().catch(() => ({}))

                if (corpo.error === "senha_fraca" && corpo.problema) {
                    setErroDeSenha(corpo.problema as PasswordProblem)
                    return
                }

                toast.error(t("signUp.error"))
                return
            }

            setIsSuccess(true)
            toast.success(t("signUp.success"))
        } catch {
            toast.error(t("signUp.error"))
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center">
                    <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-12 w-12 text-indigo-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{t("signUp.successTitle")}</CardTitle>
                    <CardDescription>{t("signUp.verifySent")}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-center gap-2">
                            <Mail className="h-5 w-5 text-[#2ec4b6]" />
                            <span className="font-medium text-gray-800">{email}</span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-brand-accent/40 bg-brand-accent/10 p-4">
                        <h3 className="mb-2 font-medium text-foreground">{t("signUp.nextStepsTitle")}</h3>
                        <ol className="space-y-2 text-sm text-muted-foreground">
                            <li>{t("signUp.step1")}</li>
                            <li>{t("signUp.step2Mkt")}</li>
                            <li>{t("signUp.step3")}</li>
                        </ol>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        className="w-full bg-[#4a2c5a] hover:bg-[#5d3a70]"
                        onClick={() => router.push("/catalog")}
                    >
                        {t("signUp.ctaMkt")}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">{t("signUp.spamHint")}</p>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4a2c5a] to-[#5d3a70] flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-white" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">{t("signUp.mktTitle")}</CardTitle>
                <CardDescription>{t("signUp.mktSubtitle")}</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t("signUp.nameLabel")}</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder={t("signUp.namePlaceholder")}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">{t("signUp.emailLabel")}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder={t("signUp.emailPlaceholder")}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">{t("signUp.passwordLabel")}</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder={t("signUp.passwordPlaceholder")}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                                setErroDeSenha(null)
                            }}
                            required
                            minLength={PASSWORD_MIN_LENGTH}
                            aria-invalid={erroDeSenha !== null}
                            aria-describedby={erroDeSenha ? "erro-senha" : undefined}
                            disabled={isLoading}
                        />
                        {erroDeSenha && (
                            <p id="erro-senha" className="text-sm text-destructive">
                                {t(MENSAGEM_DE_SENHA[erroDeSenha])}
                            </p>
                        )}
                    </div>

                    <div className="bg-gradient-to-r from-[#4a2c5a]/5 to-[#2ec4b6]/5 rounded-lg p-4 border border-[#2ec4b6]/20">
                        <h3 className="mb-2 font-medium text-foreground">{t("signUp.benefitsTitle")}</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>✓ {t("signUp.benefit1")}</li>
                            <li>✓ {t("signUp.benefit2")}</li>
                            <li>✓ {t("signUp.benefit3")}</li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className="w-full bg-[#4a2c5a] hover:bg-[#5d3a70]"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("signUp.submitMkt")}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                        {t("signUp.haveAccount")}{" "}
                        <Link href={signInHref} className="text-primary hover:underline">
                            {t("signUp.enter")}
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}
