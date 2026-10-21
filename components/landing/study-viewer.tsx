// components/landing/study-viewer.tsx
"use client"

import { ExternalLink, FileText } from "lucide-react"
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

/**
 * Visualizador da amostra gratuita, sem e-mail.
 *
 * O PDF só é baixado quando a pessoa abre o modal (o Radix desmonta o conteúdo
 * ao fechar) — a home não paga o custo de um arquivo de dezenas de MB para quem
 * nunca vai ler. A rota `/api/free-sample/pdf` é o destino tanto do iframe
 * quanto do link "abrir em nova aba": ela redireciona para uma URL assinada
 * renovada a cada abertura.
 *
 * O link em nova aba não é enfeite: o visualizador nativo do iOS não rola
 * PDFs dentro de iframe (mostra só a primeira página). É a saída para mobile.
 */
export function StudyViewer() {
    const t = useTranslations("landing.freeSample")
    const pdfUrl = "/api/free-sample/pdf"

    return (
        <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="flex flex-col items-center gap-4 border-b border-border bg-muted/40 px-6 py-8 text-center sm:flex-row sm:text-left">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-brand-accent/15 text-brand-accent-strong">
                    <FileText className="h-7 w-7" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                    {/* Nome de arquivo é detalhe de armazenamento
                        (`Bolivia_HoReCa_Market_Entry_Study.pdf`), não rótulo
                        de produto — e não é traduzido. */}
                    <p className="font-medium text-foreground">{t("viewerFileLabel")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t("viewerDescription")}</p>
                </div>
            </div>

            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:justify-center">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="lg">{t("viewerCta")}</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-5xl gap-0 p-0">
                        <DialogHeader className="border-b p-4 pr-12">
                            <DialogTitle>{t("viewerTitle")}</DialogTitle>
                            <DialogDescription>{t("viewerDescription")}</DialogDescription>
                        </DialogHeader>
                        <div className="h-[70vh] w-full bg-muted">
                            {/* `#view=FitH` abre o PDF já ajustado à largura. */}
                            <iframe
                                src={`${pdfUrl}#view=FitH`}
                                title={t("viewerTitle")}
                                className="h-full w-full"
                            />
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

                <Button size="lg" variant="outline" asChild>
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        {t("viewerNewTab")}
                    </a>
                </Button>
            </div>
        </div>
    )
}
