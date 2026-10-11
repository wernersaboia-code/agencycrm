// lib/analytics/visitas-por-estudo.ts

import { LOCALES } from "@/lib/i18n/locales"

/**
 * Visitas agrupadas por ESTUDO, e não por endereço.
 *
 * A página de um estudo existe em um endereço por idioma: /list/<slug> (pt) e
 * /<idioma>/list/<slug> nos demais. No Web Analytics cada endereço é uma linha,
 * então o interesse por um estudo aparecia espalhado em até oito linhas. Aqui
 * as linhas do mesmo estudo viram uma só, com o detalhe por idioma.
 *
 * Visitantes são SOMADOS entre idiomas: a Vercel não diz se o visitante do
 * /de/list/x é o mesmo do /en/list/x. Para estudo, a soma é a leitura certa
 * na prática — raramente a mesma pessoa abre o mesmo estudo em dois idiomas
 * no mesmo dia.
 */

export type LinhaDePagina = { label: string; pageviews: number; visitors: number }

export type VisitasDoEstudo = {
    slug: string
    pageviews: number
    visitors: number
    /** Visualizações por idioma da página ("pt" para o endereço sem prefixo). */
    porIdioma: Record<string, number>
}

const IDIOMA_PADRAO = "pt"

/** Idioma e slug de uma página de estudo, ou null para qualquer outra página. */
export function estudoDaPagina(path: string): { slug: string; idioma: string } | null {
    const partes = path.split("?")[0].split("/").filter(Boolean)
    const comIdioma = partes.length === 3 && (LOCALES as readonly string[]).includes(partes[0])
    const [idioma, lista, slug] = comIdioma ? partes : [IDIOMA_PADRAO, ...partes]
    if (lista !== "list" || !slug || partes.length !== (comIdioma ? 3 : 2)) return null
    return { slug, idioma }
}

/** Junta as linhas de página do mesmo estudo, da mais vista para a menos vista. */
export function agruparPorEstudo(linhas: readonly LinhaDePagina[]): VisitasDoEstudo[] {
    const porSlug = new Map<string, VisitasDoEstudo>()
    for (const linha of linhas) {
        const estudo = estudoDaPagina(linha.label)
        if (!estudo) continue
        const atual = porSlug.get(estudo.slug) ?? { slug: estudo.slug, pageviews: 0, visitors: 0, porIdioma: {} }
        atual.pageviews += linha.pageviews
        atual.visitors += linha.visitors
        atual.porIdioma[estudo.idioma] = (atual.porIdioma[estudo.idioma] ?? 0) + linha.pageviews
        porSlug.set(estudo.slug, atual)
    }
    return [...porSlug.values()].sort((a, b) => b.pageviews - a.pageviews || b.visitors - a.visitors)
}

function citar(valor: string): string {
    return `'${valor.replaceAll("'", "''")}'`
}

/** Todos os endereços de um estudo, em todos os idiomas. */
export function paginasDoEstudo(slug: string): string[] {
    return [`/list/${slug}`, ...LOCALES.map((idioma) => `/${idioma}/list/${slug}`)]
}

/** Filtro da API da Vercel para as páginas de um estudo, em qualquer idioma. */
export function filtroDoEstudo(slug: string): string {
    return `(${paginasDoEstudo(slug).map((path) => `requestPath eq ${citar(path)}`).join(" or ")})`
}

/** Filtro da API da Vercel para as páginas de QUALQUER estudo. */
export function filtroDePaginasDeEstudo(): string {
    const prefixos = ["/list/", ...LOCALES.map((idioma) => `/${idioma}/list/`)]
    return `(${prefixos.map((prefixo) => `startswith(requestPath, ${citar(prefixo)})`).join(" or ")})`
}
