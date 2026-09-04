"use client"

import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/lib/i18n/navigation"
import { FlagIcon } from "@/components/ui/flag-icon"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { ArrowRight, ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { cn } from "@/lib/utils"

export interface FeaturedStudy {
    id: string
    name: string
    slug: string
    description: string | null
    countries: string[]
    industries: string[]
    totalLeads: number
    price: number
    currency: string
}

/**
 * Estudos em destaque como um showcase interativo: um estudo por vez, num painel
 * premium, com a lista das outras opções clicável ao lado. Os dados são REAIS do
 * catálogo.
 *
 * Ao contrário do "Por dentro de cada estudo", este NÃO avança sozinho. A home
 * tinha dois showcases com a mesma anatomia e dois temporizadores rodando ao
 * mesmo tempo, o que deixava a página inquieta e fazia as duas seções lerem como
 * a mesma seção repetida. Um showcase que se apresenta sozinho basta; aqui, onde
 * cada troca muda preço e botão de compra, mexer no conteúdo por baixo de quem
 * está lendo é pior do que esperar o clique.
 *
 * A animação de troca continua, e continua respeitando `prefers-reduced-motion`.
 */
export function FeaturedStudiesShowcase({ studies }: { studies: FeaturedStudy[] }) {
    const [active, setActive] = useState(0)
    const reduceMotion = useReducedMotion()
    const locale = useLocale()
    const t = useTranslations("catalog")
    const tCart = useTranslations("cart")
    const { addItem } = useCart()

    const current = studies[active]
    if (!current) return null

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        addItem({
            id: current.id,
            name: current.name,
            slug: current.slug,
            price: current.price,
            currency: current.currency,
            totalLeads: current.totalLeads,
        })
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* Painel do estudo em destaque */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current.id}
                        initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
                        animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-vitrine"
                    >
                        <div className="flex items-center gap-2">
                            {current.countries.slice(0, 4).map((code) => (
                                <FlagIcon key={code} code={code} size="lg" />
                            ))}
                        </div>

                        <h3 className="mt-4 text-2xl font-bold text-foreground">{current.name}</h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                            {current.description || t("defaultDescription")}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {current.industries.slice(0, 4).map((industry) => (
                                <Badge key={industry} variant="secondary">
                                    {t(`industries.${industry}`)}
                                </Badge>
                            ))}
                        </div>

                        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
                            <span className="text-3xl font-bold text-brand">
                                {formatCurrency(current.price, current.currency, locale)}
                            </span>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleAddToCart}
                                    className="hover:border-brand-accent hover:bg-brand-accent hover:text-white"
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                    {tCart("addToCart")}
                                </Button>
                                <Button className="vitrine-btn-primary" asChild>
                                    <Link href={`/list/${current.slug}`}>
                                        {t("seeDetails")}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Lista clicável das outras opções */}
            <div className="space-y-3">
                {studies.map((study, index) => {
                    const isActive = index === active
                    return (
                        <button
                            key={study.id}
                            type="button"
                            onClick={() => setActive(index)}
                            aria-pressed={isActive}
                            className={cn(
                                "w-full rounded-xl border p-4 text-left transition-colors",
                                isActive
                                    ? "border-brand-accent bg-brand-accent/10"
                                    : "border-border bg-card hover:border-brand-accent/50"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                {study.countries.slice(0, 3).map((code) => (
                                    <FlagIcon key={code} code={code} size="md" />
                                ))}
                            </div>
                            <span className="mt-1.5 block font-semibold text-foreground line-clamp-1">
                                {study.name}
                            </span>
                            <span className="mt-1 block text-sm font-medium text-brand">
                                {formatCurrency(study.price, study.currency, locale)}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
