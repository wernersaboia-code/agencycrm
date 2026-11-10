// lib/blog/sanitize-translations.ts
import { sanitizeHtmlForPreview } from "@/lib/utils/html-sanitizer"
import { limparHtmlDeColagem } from "@/lib/blog/paste-cleanup"
import { rebaixarTitulosDoCorpo } from "@/lib/blog/heading-levels"

// Limpar ANTES de sanitizar. A limpeza é sobre consistência visual e o
// sanitizador é sobre segurança — se a ordem se inverter, o sanitizador
// deixa de ser a última palavra sobre o que vai ao banco.
//
// Roda aqui mesmo com a limpeza já tendo rodado no editor: o cliente é
// burlável, e `style` passa inteiro pelo sanitizador.
export function sanitizeTranslations<T extends { contentHtml: string }>(translations: T[]): T[] {
    return translations.map((t) => ({
        ...t,
        // O rebaixamento de h1 só troca nome de tag; o sanitizador continua
        // sendo a última palavra.
        contentHtml: sanitizeHtmlForPreview(rebaixarTitulosDoCorpo(limparHtmlDeColagem(t.contentHtml))),
    }))
}
