// components/marketplace/free-study-banner.tsx
"use client"

// eslint-disable-next-line no-restricted-imports -- usado só para /sign-up, fora do segmento de locale
import NextLink from "next/link"
import { Gift } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { Link as LocaleLink } from "@/lib/i18n/navigation"

/**
 * Oferta do estudo gratuito: quem não tem conta é chamado a criar uma; quem
 * já tem é lembrado de que o estudo está em Minhas compras.
 *
 * É client porque catálogo e página do estudo não leem a sessão no servidor —
 * fazer isso tiraria a página do cache. Enquanto a sessão carrega não mostra
 * nada, para não oferecer cadastro a quem já está logado.
 *
 * Só deve ser renderizada com amostra ativa: quem decide é o servidor (ver
 * FreeStudyOffer), porque a oferta sem arquivo por trás é promessa vazia.
 */
export type FreeStudyLayout = "row" | "stack"

export function FreeStudyBanner({
    className = "",
    // "stack" para colunas estreitas (a lateral da página do estudo), onde
    // texto e botão lado a lado espremeriam o texto.
    layout = "row",
}: {
    className?: string
    layout?: FreeStudyLayout
}) {
    const t = useTranslations("freeStudy")
    const locale = useLocale()
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) return null

    const disposicao = layout === "row" ? "sm:flex-row sm:items-center sm:justify-between" : ""

    return (
        <div
            className={`flex flex-col gap-3 rounded-lg border border-brand-accent/40 bg-brand-accent/10 p-4 ${disposicao} ${className}`}
        >
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-card text-brand-accent-strong">
                    <Gift className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                    {!isAuthenticated && (
                        <div className="font-semibold text-foreground">{t("bannerTitle")}</div>
                    )}
                    <p className="text-sm text-muted-foreground">
                        {isAuthenticated ? t("bannerTextLoggedIn") : t("bannerText")}
                    </p>
                </div>
            </div>

            <Button variant="outline" className="shrink-0 bg-card" asChild>
                {isAuthenticated ? (
                    <LocaleLink href="/my-purchases">{t("bannerCtaLoggedIn")}</LocaleLink>
                ) : (
                    // /sign-up fica fora do segmento de idioma: link puro, com o
                    // idioma no parâmetro para a tela abrir na língua certa.
                    <NextLink href={`/sign-up?lang=${locale}`}>{t("bannerCta")}</NextLink>
                )}
            </Button>
        </div>
    )
}
