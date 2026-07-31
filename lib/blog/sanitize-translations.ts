// lib/blog/sanitize-translations.ts
import { sanitizeHtmlForPreview } from "@/lib/utils/html-sanitizer"
import { limparHtmlDeColagem } from "@/lib/blog/paste-cleanup"

// Limpar ANTES de sanitizar. A limpeza é sobre consistência visual e o
// sanitizador é sobre segurança — se a ordem se inverter, o sanitizador
// deixa de ser a última palavra sobre o que vai ao banco.
//
// Roda aqui mesmo com a limpeza já tendo rodado no editor: o cliente é
// burlável, e `style` passa inteiro pelo sanitizador.
export function sanitizeTranslations<T extends { contentHtml: string }>(translations: T[]): T[] {
    return translations.map((t) => ({
        ...t,
        contentHtml: sanitizeHtmlForPreview(limparHtmlDeColagem(t.contentHtml)),
    }))
}
