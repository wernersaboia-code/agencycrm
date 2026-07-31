"use client"

import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BlogLocale } from "@/lib/blog/locales"

/**
 * A prévia lê o BANCO, não a tela. Por isso o botão avisa quando há alteração
 * pendente em vez de salvar sozinho: salvar sozinho um post já publicado
 * publicaria a alteração sem o autor pedir.
 */
export function PreviewButton({
    postId,
    locale,
    temAlteracaoNaoSalva,
}: {
    postId?: string
    locale: BlogLocale
    temAlteracaoNaoSalva: boolean
}) {
    const t = useTranslations("admin.blogEditor")

    if (!postId) {
        return (
            <Button type="button" variant="outline" disabled title={t("previewNeedsSave")}>
                <ExternalLink className="h-4 w-4" />
                {t("preview")}
            </Button>
        )
    }

    return (
        <Button
            type="button"
            variant="outline"
            onClick={() => {
                if (temAlteracaoNaoSalva) toast.info(t("previewIsSavedVersion"))
                window.open(`/blog-preview/${postId}?locale=${locale}`, "_blank", "noopener")
            }}
        >
            <ExternalLink className="h-4 w-4" />
            {t("preview")}
        </Button>
    )
}
