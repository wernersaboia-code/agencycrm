// components/marketplace/list-card.tsx
"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Building2, Globe, CheckCircle, ArrowRight, ShoppingCart } from "lucide-react"
import { FlagIcon } from "@/components/ui/flag-icon"
import { useCart } from "@/contexts/cart-context"

// Definir tipo específico para previewData
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
    const { addItem } = useCart()

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault() // Evitar navegação
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
        <Card className="h-full hover:shadow-lg transition-shadow border-gray-200 hover:border-[#2ec4b6] group">
            <CardContent className="p-5 flex flex-col h-full">
                {/* Header */}
                <Link href={`/list/${list.slug}`} className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            {list.isFeatured && (
                                <Badge className="mb-2 bg-[#4a2c5a] hover:bg-[#4a2c5a]">
                                    Destaque
                                </Badge>
                            )}
                            <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-[#2ec4b6] transition-colors">
                                {list.name}
                            </h3>
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
                                <span className="text-xs text-gray-400 ml-1">
                                    +{list.countries.length - 3}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span>{list.totalLeads.toLocaleString()} empresas</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Globe className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{list.countries.slice(0, 3).join(", ")}{list.countries.length > 3 ? ` +${list.countries.length - 3}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-[#2ec4b6]" />
                            <span>Emails verificados</span>
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
                <div className="pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-2xl font-bold text-[#4a2c5a]">
                                {formatCurrency(list.price, list.currency)}
                            </span>
                        </div>
                        <Link
                            href={`/list/${list.slug}`}
                            className="flex items-center text-sm text-[#2ec4b6] font-medium hover:translate-x-1 transition-transform"
                        >
                            Ver detalhes
                            <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                        onClick={handleAddToCart}
                        variant="outline"
                        size="sm"
                        className="w-full hover:bg-[#2ec4b6] hover:text-white hover:border-[#2ec4b6] transition-colors"
                    >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Adicionar ao Carrinho
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
