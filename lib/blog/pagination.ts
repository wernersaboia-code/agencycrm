// lib/blog/pagination.ts

/**
 * Fonte única do tamanho da página do índice do blog. A query
 * (`getPublishedPostsForLocale`) tem o mesmo 9 como padrão; passar daqui deixa
 * explícito que a grade de 3 colunas fecha em 3 linhas.
 */
export const BLOG_PAGE_SIZE = 9

/**
 * `?page=` vem da URL como string arbitrária ("2", "abc", "-1", "1.7").
 * Normaliza para inteiro >= 1 — a página é sempre montada daqui, nunca do
 * valor cru, para uma URL inválida cair na primeira página em vez de vazia.
 */
export function normalizarPagina(raw: string | undefined): number {
    const pagina = Math.floor(Number(raw ?? 1))
    return Number.isFinite(pagina) && pagina > 0 ? pagina : 1
}

export function totalDePaginas(total: number, pageSize: number = BLOG_PAGE_SIZE): number {
    if (!Number.isFinite(total) || total <= 0) return 1
    const tamanho = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : BLOG_PAGE_SIZE
    return Math.max(1, Math.ceil(total / tamanho))
}
