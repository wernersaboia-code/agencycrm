import { PUBLISHED_LOCALES, type Locale } from "@/lib/i18n/locales"
import { legalLocales } from "@/content/legal"

/**
 * Quais idiomas têm conteúdo DE VERDADE numa rota pública.
 *
 * `PUBLISHED_LOCALES` responde "este idioma tem interface traduzida?" — e
 * essa é a pergunta certa para a maior parte do funil, onde o texto vem de
 * `messages/*.json`. Mas três rotas não tiram o texto de lá: /terms,
 * /privacy e /refund vêm de um documento por idioma em `content/legal`, e
 * idioma sem documento cai no português. A interface fica em árabe, o
 * contrato fica em português, e o sitemap anuncia a página como árabe.
 *
 * Foi o que aconteceu quando o árabe entrou em PUBLISHED_LOCALES na fase 4:
 * dos 8 URLs novos, 4 serviam português. Daí este módulo — a lista de
 * publicados deixa de ser resposta suficiente para montar sitemap, hreflang
 * e robots dessas rotas.
 *
 * O índice do blog (/blog) tem o mesmo problema por outro motivo: os posts
 * vivem no banco, com tradução por post, então a cobertura muda a cada
 * publicação e não cabe num mapa estático. Quem precisa dela deriva dos
 * próprios posts — o sitemap a partir da consulta que já faz, e a página a
 * partir da lista que já carregou.
 */
const COBERTURA: Record<string, readonly Locale[]> = {
    "/terms": legalLocales("terms"),
    "/privacy": legalLocales("privacy"),
    "/refund": legalLocales("refund"),
}

/** Rota sem entrada no mapa tira o texto de `messages/` e vale nos 8. */
export function localesComConteudo(path: string): readonly Locale[] {
    return COBERTURA[path] ?? PUBLISHED_LOCALES
}

export function temConteudoNoLocale(path: string, locale: Locale): boolean {
    return localesComConteudo(path).includes(locale)
}
