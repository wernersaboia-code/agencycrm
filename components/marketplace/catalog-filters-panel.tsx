// components/marketplace/catalog-filters-panel.tsx
"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { CatalogSidebar } from "@/components/marketplace/catalog-sidebar"

type CatalogFiltersPanelProps = React.ComponentProps<typeof CatalogSidebar> & {
    activeFilterCount: number
}

/**
 * No desktop os filtros ficam na coluna lateral. No mobile eles somavam ~30
 * linhas empilhadas acima do primeiro card — aqui viram uma gaveta, para que a
 * primeira coisa visível na tela pequena seja o produto.
 */
export function CatalogFiltersPanel({ activeFilterCount, ...sidebarProps }: CatalogFiltersPanelProps) {
    const t = useTranslations("catalog")
    const [open, setOpen] = useState(false)

    return (
        <>
            <div className="lg:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="w-full justify-center">
                            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                            {t("filtersOpen")}
                            {activeFilterCount > 0 && (
                                <span className="ms-1 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-brand-foreground">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[85vw] overflow-y-auto sm:max-w-sm">
                        <SheetHeader>
                            <SheetTitle>{t("filtersTitle")}</SheetTitle>
                            <SheetDescription>{t("filtersSubtitle")}</SheetDescription>
                        </SheetHeader>
                        <div className="px-4 pb-8">
                            {/* Fechar a gaveta ao filtrar deixa o resultado à vista;
                                do contrário o painel cobre a grade que acabou de mudar. */}
                            <CatalogSidebar
                                {...sidebarProps}
                                hideHeading
                                onNavigate={() => setOpen(false)}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Sem altura máxima o painel gruda no topo e o fim da lista fica
                inalcançável: a roda do mouse rola a página, não o painel. */}
            <aside className="hidden rounded-lg border border-border bg-card p-4 lg:sticky lg:top-24 lg:block lg:max-h-[calc(100dvh-7rem)] lg:w-72 lg:shrink-0 lg:overflow-y-auto">
                <CatalogSidebar {...sidebarProps} />
            </aside>
        </>
    )
}
