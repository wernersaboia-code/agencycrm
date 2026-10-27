"use client"

import { ArrowRight, CheckCircle2, FileText } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { Link } from "@/lib/i18n/navigation"

/**
 * Folha de estudo que se monta sozinha no hero: o produto aparece funcionando
 * logo no primeiro olhar, como a demonstração da home do story-magic.
 *
 * Roda uma vez, devagar, sem loop — a página é sóbria de propósito. O conteúdo
 * é o que o estudo de fato traz (os tópicos de `landing.lieferumfang`), sem
 * país nem número: a amostra é trocada no admin e a prévia não pode mentir.
 */
export function HeroStudyPreview({
    eyebrow,
    title,
    contentsLabel,
    items,
    cta,
    href,
}: {
    eyebrow: string
    title: string
    contentsLabel: string
    items: string[]
    cta: string
    href: string
}) {
    const reduce = useReducedMotion()
    const start = 0.5
    const step = 0.45
    const ctaAt = start + items.length * step + 0.2

    const appear = (delay: number) =>
        reduce
            ? {}
            : {
                  initial: { opacity: 0, y: 6 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
              }

    return (
        <div className="relative mx-auto w-full max-w-md">
            {/* Folha de trás: dá a ideia de documento sem precisar de ilustração. */}
            <div
                aria-hidden
                className="absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-xl border border-border bg-card/70"
            />
            <motion.div {...(reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } })}>
                <Link
                    href={href}
                    className="group relative block rounded-xl border border-border bg-card p-6 text-left shadow-xl shadow-brand/10 transition-shadow hover:shadow-2xl hover:shadow-brand/15"
                >
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-accent/15 text-brand-accent-strong">
                            <FileText className="h-5 w-5" aria-hidden />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent-strong">{eyebrow}</p>
                            <p className="truncate font-semibold text-foreground">{title}</p>
                        </div>
                    </div>

                    <div aria-hidden className="mt-5 space-y-2">
                        <span className="block h-2 w-full rounded-full bg-muted" />
                        <span className="block h-2 w-11/12 rounded-full bg-muted" />
                        <span className="block h-2 w-2/3 rounded-full bg-muted" />
                    </div>

                    <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand-accent-strong">
                        {contentsLabel}
                    </p>
                    <ul className="mt-3 space-y-2.5">
                        {items.map((item, i) => (
                            <motion.li
                                key={item}
                                className="flex items-start gap-2.5 text-sm leading-5 text-foreground"
                                {...appear(start + i * step)}
                            >
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent-strong" aria-hidden />
                                {item}
                            </motion.li>
                        ))}
                    </ul>

                    {/* Aparência de botão, mas é um span: o cartão inteiro já é o link. */}
                    <motion.span
                        className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand px-6 text-sm font-medium text-brand-foreground transition-colors group-hover:bg-brand-hover"
                        {...appear(ctaAt)}
                    >
                        {cta}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </motion.span>
                </Link>
            </motion.div>
        </div>
    )
}
