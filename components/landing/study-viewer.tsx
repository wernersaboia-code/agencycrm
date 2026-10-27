// components/landing/study-viewer.tsx
"use client"

import { useEffect, useState } from "react"
import { ExternalLink, FileText } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const PAGE_MS = 3500

/**
 * A amostra gratuita no topo da home: as páginas reais do estudo passam
 * sozinhas, como um folhear lento, e o botão abre a leitura completa.
 *
 * Antes eram dois blocos — uma prévia no hero e uma seção "Estudo gratuito"
 * logo abaixo — dizendo a mesma coisa. Agora o bloco é um só.
 *
 * O folhear para com o mouse em cima (dá para ler a página) e não roda para
 * quem pediu menos movimento no sistema: fica parado na capa.
 *
 * O PDF só é baixado quando a pessoa abre o modal (o Radix desmonta o conteúdo
 * ao fechar). A rota `/api/free-sample/pdf` é o destino tanto do iframe quanto
 * do link "abrir em nova aba": ela redireciona para uma URL assinada renovada a
 * cada abertura. O link em nova aba não é enfeite: o visualizador nativo do iOS
 * não rola PDFs dentro de iframe (mostra só a primeira página).
 */
export function StudyViewer({
    id,
    pages,
    signUpText,
    signUpCta,
    signUpHref,
}: {
    id: string
    pages: string[]
    signUpText: string
    signUpCta: string
    signUpHref: string
}) {
    const t = useTranslations("landing.freeSample")
    const pdfUrl = "/api/free-sample/pdf"
    const reduce = useReducedMotion()
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)

    useEffect(() => {
        if (reduce || paused || pages.length < 2) return
        const timer = window.setInterval(() => setIndex((i) => (i + 1) % pages.length), PAGE_MS)
        return () => window.clearInterval(timer)
    }, [reduce, paused, pages.length])

    const next = (index + 1) % pages.length

    return (
        <div id={id} className="mx-auto w-full max-w-sm scroll-mt-20">
            <Dialog>
                <div className="rounded-xl border border-border bg-card p-5 shadow-xl shadow-brand/10">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent-strong">
                        {t("eyebrow")}
                    </p>
                    <p className="mt-1 font-semibold text-foreground">{t("title")}</p>

                    <DialogTrigger asChild>
                        <button
                            type="button"
                            aria-label={t("viewerCta")}
                            className="group relative mt-4 block w-full cursor-pointer"
                            onMouseEnter={() => setPaused(true)}
                            onMouseLeave={() => setPaused(false)}
                            onFocus={() => setPaused(true)}
                            onBlur={() => setPaused(false)}
                        >
                            {/* Folha de trás: dá a ideia de documento. */}
                            <span
                                aria-hidden
                                className="absolute inset-0 translate-x-2 translate-y-2 rotate-2 rounded-md border border-border bg-muted"
                            />
                            {/* Moldura A4, o formato dos estudos; `object-contain` nas
                                páginas para um PDF em Carta não perder o rodapé. */}
                            <span className="relative block aspect-[1/1.414] overflow-hidden rounded-md border border-border bg-white shadow-md transition-shadow group-hover:shadow-lg">
                                {pages.length > 0 ? (
                                    <>
                                        <AnimatePresence initial={false}>
                                            <motion.img
                                                key={pages[index]}
                                                src={pages[index]}
                                                alt=""
                                                className="absolute inset-0 h-full w-full object-contain"
                                                initial={{ opacity: 0, x: 16 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -16 }}
                                                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                                            />
                                        </AnimatePresence>
                                        {/* Pré-carrega a próxima página para a troca não piscar. */}
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={pages[next]} alt="" aria-hidden className="hidden" />
                                    </>
                                ) : (
                                    // Páginas ainda não geradas (ou o desenho falhou no
                                    // admin): uma folha neutra, o bloco segue funcionando.
                                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                        <FileText className="h-10 w-10 text-brand-accent-strong" aria-hidden />
                                        <span className="px-6 text-center text-sm font-medium text-foreground">
                                            {t("viewerFileLabel")}
                                        </span>
                                    </span>
                                )}
                            </span>
                        </button>
                    </DialogTrigger>

                    {pages.length > 0 && (
                        <p className="mt-3 text-center text-xs tabular-nums text-muted-foreground" aria-hidden>
                            {index + 1} / {pages.length}
                        </p>
                    )}

                    <DialogTrigger asChild>
                        <Button size="lg" className="mt-3 w-full bg-brand text-brand-foreground hover:bg-brand-hover">
                            {t("viewerCta")}
                        </Button>
                    </DialogTrigger>

                    {/* A leitura é aberta; a conta é para quem quer o estudo
                        guardado junto das compras. */}
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                        {signUpText}{" "}
                        <a
                            href={signUpHref}
                            className="font-medium text-brand-accent-strong underline underline-offset-4 hover:no-underline"
                        >
                            {signUpCta}
                        </a>
                    </p>
                </div>

                <DialogContent className="sm:max-w-5xl gap-0 p-0">
                    <DialogHeader className="border-b p-4 pr-12">
                        <DialogTitle>{t("viewerTitle")}</DialogTitle>
                        <DialogDescription>{t("viewerDescription")}</DialogDescription>
                    </DialogHeader>
                    <div className="h-[70vh] w-full bg-muted">
                        {/* `#view=FitH` abre o PDF já ajustado à largura. */}
                        <iframe src={`${pdfUrl}#view=FitH`} title={t("viewerTitle")} className="h-full w-full" />
                    </div>
                    <div className="border-t p-3 text-center">
                        <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent-strong underline underline-offset-4 hover:no-underline"
                        >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            {t("viewerNewTab")}
                        </a>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
