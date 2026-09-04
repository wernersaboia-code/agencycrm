"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface ShowcaseArea {
    key: string
    eyebrow: string
    title: string
    description: string
    /** Imagem real de uma página do estudo, em `/estudo-exemplo/*.webp`. */
    src: string
    alt: string
    /** Abre a página inteira em aba nova — sem biblioteca de lightbox. */
    href: string
}

const AUTO_ADVANCE_MS = 4500

/**
 * Showcase interativo no molde da duna: uma coluna de "áreas" clicável e em
 * avanço automático, e ao lado um bloco de mini-páginas empilhadas (o look de
 * "Onboarding"). As imagens são páginas REAIS de um estudo do catálogo — nunca
 * simulação de produto que não existe.
 *
 * O painel NÃO é um link. A imagem em tamanho cheio é um `.webp` solto, e cair
 * num arquivo de imagem depois de clicar num painel de destaque quebra na hora
 * a leitura de vitrine. O acesso continua existindo, num link discreto e
 * rotulado embaixo, junto da nota que diz o que a amostra mostra e o que ela
 * esconde.
 *
 * Respeita `prefers-reduced-motion`: sem animação automática nem movimento,
 * apenas a troca por clique.
 */
export function Showcase({
    areas,
    note,
    viewFullLabel,
}: {
    areas: ShowcaseArea[]
    /** Diz que os contatos estão borrados e que o estudo é em inglês. */
    note: string
    viewFullLabel: string
}) {
    const [active, setActive] = useState(0)
    const [paused, setPaused] = useState(false)
    const reduceMotion = useReducedMotion()

    useEffect(() => {
        if (areas.length <= 1 || reduceMotion || paused) return
        const timer = setInterval(() => {
            setActive((current) => (current + 1) % areas.length)
        }, AUTO_ADVANCE_MS)
        return () => clearInterval(timer)
    }, [areas.length, reduceMotion, paused])

    const current = areas[active] ?? areas[0]
    if (!current) return null

    return (
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* Coluna de áreas: clicável + auto-avança */}
            <div className="space-y-3">
                {areas.map((area, index) => {
                    const isActive = index === active
                    return (
                        <button
                            key={area.key}
                            type="button"
                            onClick={() => setActive(index)}
                            aria-pressed={isActive}
                            className={cn(
                                "block w-full rounded-xl border p-4 text-left transition-colors",
                                isActive
                                    ? "border-brand-accent bg-brand-accent/10"
                                    : "border-border bg-card hover:border-brand-accent/50"
                            )}
                        >
                            <span className="text-xs font-semibold uppercase tracking-wider text-brand-accent-strong">
                                {area.eyebrow}
                            </span>
                            <span className="mt-1 block text-lg font-semibold text-foreground">
                                {area.title}
                            </span>
                            <AnimatePresence initial={false}>
                                {isActive && (
                                    <motion.span
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="mt-2 block text-sm leading-6 text-muted-foreground"
                                    >
                                        {area.description}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                    )
                })}
            </div>

            {/* Bloco de mini-páginas empilhadas */}
            <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
                <div className="relative mx-auto aspect-[3/4] w-full max-w-sm">
                    {/* Camadas atrás, para o efeito de pilha de páginas */}
                    <div className="absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-2xl bg-brand-accent/15" aria-hidden />
                    <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-1 rounded-2xl bg-brand-accent/25" aria-hidden />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current.key}
                            className="absolute inset-0 overflow-hidden rounded-2xl border border-border bg-card shadow-vitrine-lg"
                            initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.96 }}
                            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                            exit={reduceMotion ? undefined : { opacity: 0, y: -10, scale: 0.97 }}
                            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <Image
                                src={current.src}
                                alt={current.alt}
                                fill
                                sizes="(min-width: 1024px) 24rem, 90vw"
                                className="object-cover"
                            />
                            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10 text-sm font-semibold text-white">
                                {current.title}
                            </span>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="mx-auto mt-5 max-w-sm">
                    <p className="text-xs leading-5 text-muted-foreground">{note}</p>
                    <a
                        href={current.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-accent-strong hover:underline"
                    >
                        {viewFullLabel}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                </div>
            </div>
        </div>
    )
}
