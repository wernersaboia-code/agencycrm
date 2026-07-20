// components/marketplace/list-card.tsx
"use client"

import { Link } from "@/lib/i18n/navigation"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Building2, Globe, CheckCircle, ArrowRight, ShoppingCart, CalendarClock } from "lucide-react"
import { FlagIcon } from "@/components/ui/flag-icon"
import { useCart } from "@/contexts/cart-context"

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
    category: string
    countries: string[]
    industries: string[]
    totalLeads: number
    price: number
    currency: string
    isActive: boolean
    isFeatured: boolean
    previewData: unknown
    createdAt: Date
    updatedAt: Date
}

interface ListCardProps {
    list: MarketplaceListCardData
}

export function ListCard({ list }: ListCardProps) {
    const t = useTranslations("catalog")
    const tCart = useTranslations("cart")
    const { addItem } = useCart()
    const pricePerLead = list.totalLeads > 0 ? list.price / list.totalLeads : 0
    const updatedAt = new Date(list.updatedAt).toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
    })

    const handleAddToCart = (e: React.MouseEvent) => {
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
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            {list.isFeatured && (
                                <Badge className="mb-2 bg-brand hover:bg-brand">
                                    {t("featured")}
                                </Badge>
                            )}
                            <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-brand-accent-strong transition-colors">
                                {list.name}
                            </h3>
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                {list.description || t("defaultDescription")}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            {list.countries.slice(0, 3).map((code) => (
                                <FlagIcon
                                    key={code}
                                    code={code}
                                    size="sm"
                                    className="shadow-sm"
                                />
                            ))}
                            {list.countries.length > 3 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                    +{list.countries.length - 3}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{t("companies", { count: list.totalLeads })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{list.countries.slice(0, 3).join(", ")}{list.countries.length > 3 ? ` +${list.countries.length - 3}` : ''}</span>
                        </div>
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
                    {list.industries.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                            {list.industries.slice(0, 3).map((industry) => (
                                <Badge key={industry} variant="secondary" className="text-xs">
                                    {industry}
                                </Badge>
                            ))}
                            {list.industries.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{list.industries.length - 3}
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
                                {formatCurrency(list.price, list.currency)}
                            </span>
                            <div className="text-xs text-muted-foreground">
                                {t("perLead", { price: formatCurrency(pricePerLead, list.currency) })}
                            </div>
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
