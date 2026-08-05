// components/landing/free-sample-form.tsx
"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Link } from "@/lib/i18n/navigation"
import { requestFreeSample } from "@/lib/free-sample/request-download"
import type { LandingLocale } from "./types"

type Estado = "idle" | "enviando" | "ok" | "erro"

export function FreeSampleForm({ locale }: { locale: LandingLocale }) {
    const t = useTranslations("landing.freeSample")
    const [email, setEmail] = useState("")
    const [consent, setConsent] = useState(false)
    const [website, setWebsite] = useState("") // honeypot
    const [estado, setEstado] = useState<Estado>("idle")
    const [mensagemErro, setMensagemErro] = useState("")

    const enviar = async (e: React.FormEvent) => {
        e.preventDefault()
        setEstado("enviando")

        let r
        try {
            r = await requestFreeSample({ email, consent, locale, website })
        } catch {
            // Qualquer exceção inesperada da action (rede caindo, etc.) não
            // pode deixar o botão travado em "enviando" para sempre sem
            // mensagem nenhuma — trata como erro genérico, igual às outras
            // falhas.
            setEstado("erro")
            setMensagemErro(t("errorGeneric"))
            return
        }

        if (!r.success) {
            setEstado("erro")
            setMensagemErro(r.error === "rate_limited" ? t("errorRateLimited") : t("errorGeneric"))
            return
        }

        // Sem downloadUrl não há o que abrir: mostrar "o download começou"
        // aqui seria mentira para quem está olhando a tela. O pedido já foi
        // gravado (a action grava antes de tentar assinar a URL) e a cópia
        // por e-mail ainda pode salvar a pessoa, mas para quem está aqui, na
        // hora, é uma falha mesmo — trata como erro genérico.
        if (!r.downloadUrl) {
            setEstado("erro")
            setMensagemErro(t("errorGeneric"))
            return
        }

        setEstado("ok")
        window.location.href = r.downloadUrl
    }

    if (estado === "ok") {
        return (
            <div role="status" className="rounded-lg border border-brand-accent/40 bg-brand-accent/10 p-5">
                <p className="font-medium text-foreground">{t("successTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("successBody")}</p>
            </div>
        )
    }

    return (
        <form onSubmit={enviar} className="space-y-4">
            {/* Honeypot: invisível para humanos, atraente para bot. `tabIndex={-1}`
                e `autoComplete="off"` para o teclado e o gerenciador de senhas
                nunca chegarem nele. */}
            <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="free-sample-website">Website</label>
                <input
                    id="free-sample-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                    type="email"
                    required
                    aria-label={t("emailLabel")}
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                />
                <Button type="submit" size="lg" disabled={estado === "enviando" || !consent}>
                    {estado === "enviando" && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t("cta")}
                </Button>
            </div>

            <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Checkbox
                    checked={consent}
                    onCheckedChange={(v) => setConsent(v === true)}
                    className="mt-0.5"
                />
                <span>
                    {t("consent")}{" "}
                    <Link href="/privacy" className="underline hover:text-foreground">
                        {t("consentLink")}
                    </Link>
                </span>
            </label>

            {estado === "erro" && (
                <p role="alert" className="text-sm text-destructive">{mensagemErro}</p>
            )}
        </form>
    )
}
