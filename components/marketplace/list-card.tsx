// components/marketplace/list-card.tsx
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Building2, Globe, CheckCircle } from "lucide-react"
import type { LeadList } from "@prisma/client"

interface ListCardProps {
    list: LeadList
}

export function ListCard({ list }: ListCardProps) {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        {list.isFeatured && (
                            <Badge className="mb-2">Destaque</Badge>
                        )}
                        <h3 className="font-semibold line-clamp-2">{list.name}</h3>
                    </div>
                    <div className="text-2xl">
                        {list.countries[0] && getFlagEmoji(list.countries[0])}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1">
                <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{list.totalLeads.toLocaleString()} leads</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>{list.countries.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Verificados</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2">
                <div className="w-full flex items-center justify-between">
          <span className="text-2xl font-bold">
            {formatCurrency(Number(list.price), list.currency)}
          </span>
                </div>
                <Button className="w-full" asChild>
                    <Link href={`/list/${list.slug}`}>Ver Detalhes</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

function getFlagEmoji(countryCode: string): string {
    const flags: Record<string, string> = {
        DE: "🇩🇪",
        FR: "🇫🇷",
        IT: "🇮🇹",
        US: "🇺🇸",
        CN: "🇨🇳",
        BR: "🇧🇷",
        PT: "🇵🇹",
        ES: "🇪🇸",
        GB: "🇬🇧",
        NL: "🇳🇱",
    }
    return flags[countryCode] || "🌍"
}