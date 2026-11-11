// components/marketplace/list-card.tsx
"use client"

import { Link } from "@/lib/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Globe, CheckCircle, ArrowRight, ShoppingCart, CalendarClock, Languages } from "lucide-react"
import { FlagIcon } from "@/components/ui/flag-icon"
import { useCart } from "@/contexts/cart-context"
import { excecoesDoIdioma, nomeDePais } from "@/lib/i18n/nome-de-pais"

export interface PreviewLead {
    companyName: string
    country: string
    sector?: string | null
    emailGeneral?: string | null
}

export interface MarketplaceListCardData {
    id: string
    name: string
    slug: string
    description: string | null
    countries: string[]
    industries: string[]
    /**
     * Nomes dos setores no idioma da página, na ordem do cadastro. Resolvidos
     * no servidor porque o cadastro de setores mora no banco
     * (ver lib/marketplace/setores.ts).
     */
    industryNames: string[]
    language: string | null
    totalLeads: number
    price: number
    currency: string
    priceIsFallback?: boolean
    isActive: boolean
    isFeatured: boolean
    previewData: unknown
    createdAt: Date
    updatedAt: Date
}

/** "inglês", "Englisch", "anglais": o nome do idioma na língua da página. */
function nomeDoIdioma(code: string, locale: string): string | null {
    try {
        return new Intl.DisplayNames([locale], { type: "language", fallback: "none" }).of(code) ?? null
    } catch {
        return null
    }
}

interface ListCardProps {
    list: MarketplaceListCardData
}

export function ListCard({ list }: ListCardProps) {
    const t = useTranslations("catalog")
    const tCart = useTranslations("cart")
    const locale = useLocale()
    const { addItem } = useCart()
    // Idioma da página, e não "pt-BR" fixo: o cartão em alemão dizia "nov. de 2026".
    const updatedAt = new Date(list.updatedAt).toLocaleDateString(locale, {
        month: "short",
        year: "numeric",
    })
    // Nome do país em vez do código: "FR" sozinho não diz nada a quem não
    // decorou a ISO, e a bandeira ao lado já faz o papel de sigla.
    const excecoes = excecoesDoIdioma(locale)
    const paises = list.countries.slice(0, 3).map((code) => nomeDePais(code, locale, excecoes))

    // Título e descrição do cartão vêm no idioma do estudo; na página em
    // português, um cartão todo em inglês parecia tradução esquecida. Só
    // aparece quando o idioma do estudo difere do da página.
    const idiomaDoEstudo =
        list.language && list.language !== locale ? nomeDoIdioma(list.language, locale) : null

    const handleAddToCart =(e: React.MouseEvent) => {
        e.preventDefault()
        addItem({
            id: list.id,
            name: list.name,
            slug: list.slug,
            price: list.price,
            currency: list.currency,
            totalLeads: list.totalLeads,
        })
    }

    return (
        <Card className="group h-full border-border transition-shadow hover:border-brand-accent hover:shadow-lg">
            <CardContent className="p-5 flex flex-col h-full">
                {/* Header */}
                <Link href={`/list/${list.slug}`} className="flex-1">
                    <div className="mb-4">
                        {/* Selo e bandeiras numa linha própria, acima do título.
                            Antes a bandeira ficava AO LADO do título e tirava
                            dele um quarto da largura: num cartão de 4 colunas,
                            "… importers and distributors" já era cortado.
                            O país é o primeiro filtro que o cliente aplica, então
                            a bandeira é o sinal que ele procura no card — em
                            16px ela virava enfeite. */}
                        <div className="mb-3 flex min-h-6 items-center justify-between gap-2">
                            {list.isFeatured ? (
                                <Badge className="bg-brand hover:bg-brand">
                                    {t("featured")}
                                </Badge>
                            ) : <span />}
                            <div className="flex shrink-0 items-center gap-1.5">
                                {list.countries.slice(0, 3).map((code) => (
                                    <FlagIcon key={code} code={code} size="lg" />
                                ))}
                                {list.countries.length > 3 && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                        +{list.countries.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Quatro linhas: os nomes dos estudos são longos
                            ("X Importers and Distributors in Y - Market Entry
                            Study", ~85 caracteres) e com duas o país do título
                            sumia. Medido na grade de 4 colunas da home, onde o
                            título tem 249px: três ainda cortavam 3 de 4. */}
                        <h3 className="font-semibold text-foreground line-clamp-4 group-hover:text-brand-accent-strong transition-colors">
                            {list.name}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                            {list.description || t("defaultDescription")}
                        </p>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{paises.join(", ")}{list.countries.length > 3 ? ` +${list.countries.length - 3}` : ''}</span>
                        </div>
                        {idiomaDoEstudo && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Languages className="h-4 w-4 text-muted-foreground" />
                                <span>{t("studyLanguage", { language: idiomaDoEstudo })}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-brand-accent-strong" />
                            <span>{t("verifiedEmails")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                            <span>{t("updatedAt", { date: updatedAt })}</span>
                        </div>
                    </div>

                    {/* Setores */}
                    {list.industryNames.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                            {list.industryNames.slice(0, 3).map((nome) => (
                                <Badge key={nome} variant="secondary" className="max-w-full text-xs whitespace-normal">
                                    {nome}
                                </Badge>
                            ))}
                            {list.industryNames.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{list.industryNames.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}
                </Link>

                {/* Footer */}
                <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-2xl font-bold text-brand">
                                {formatCurrency(list.price, list.currency, locale)}
                            </span>
                        </div>
                        <Link
                            href={`/list/${list.slug}`}
                            className="flex items-center text-sm text-brand-accent-strong font-medium hover:translate-x-1 transition-transform"
                        >
                            {t("seeDetails")}
                            <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                        onClick={handleAddToCart}
                        variant="outline"
                        size="sm"
                        className="w-full hover:bg-brand-accent hover:text-white hover:border-brand-accent transition-colors"
                    >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {tCart("addToCart")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
