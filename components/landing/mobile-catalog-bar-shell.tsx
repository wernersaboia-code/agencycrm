"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

/** Marca os botões de catálogo que já estão na página (hero e fecho). */
export const CATALOG_CTA_ATTR = "data-catalog-cta"

/**
 * Mostra a barra só enquanto nenhum botão de catálogo da própria página está
 * na tela: com o do hero ou o do fecho visíveis, ela seria um segundo botão
 * igual a dois dedos de distância.
 *
 * Começa escondida e só aparece depois que o observador responde, para não
 * piscar por cima do hero no carregamento.
 */
export function MobileCatalogBarShell({ children }: { children: React.ReactNode }) {
    const [visivel, setVisivel] = useState(false)

    useEffect(() => {
        const alvos = Array.from(document.querySelectorAll(`[${CATALOG_CTA_ATTR}]`))
        if (alvos.length === 0) return

        const naTela = new Set<Element>()
        const observador = new IntersectionObserver((entradas) => {
            for (const entrada of entradas) {
                if (entrada.isIntersecting) naTela.add(entrada.target)
                else naTela.delete(entrada.target)
            }
            setVisivel(naTela.size === 0)
        })

        alvos.forEach((alvo) => observador.observe(alvo))
        return () => observador.disconnect()
    }, [])

    return (
        <>
            {/* Reserva a altura da barra no fim da página, para ela não cobrir
                o rodapé. Só no celular, como a barra. */}
            <div aria-hidden className="h-20 md:hidden" />
            <div
                // `inert` quando escondida: fora da tela, o botão não pode
                // receber foco de teclado nem ser lido.
                inert={!visivel}
                className={cn(
                    "fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 supports-[backdrop-filter]:bg-background/80 md:hidden",
                    visivel ? "translate-y-0" : "translate-y-full"
                )}
            >
                {children}
            </div>
        </>
    )
}
