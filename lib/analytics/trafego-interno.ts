// lib/analytics/trafego-interno.ts

/**
 * O que NÃO entra no Web Analytics: as visitas da própria equipe.
 *
 * Medido em 10/10/2026, nos 30 dias anteriores: 587 das 705 visualizações
 * vinham de um único computador na Alemanha (desktop, Windows, acesso direto,
 * com /super-admin entre as páginas mais vistas), e 211 eram páginas do
 * próprio admin. A audiência real do site ficava escondida embaixo disso.
 *
 * Duas regras:
 * - na área logada (admin e CRM) só contam as páginas de entrada, /sign-in e
 *   /sign-up, que são etapa do funil de quem compra;
 * - no site público, o navegador que já abriu o admin fica marcado e deixa de
 *   ser contado. A marca vale por navegador: a equipe que usar outro aparelho
 *   precisa abrir o admin nele uma vez.
 */

/** Chave no localStorage que marca o navegador como da equipe. */
export const MARCA_EQUIPE = "ep-equipe"

/** Páginas da área logada que contam como audiência. */
export const PAGINAS_DE_ENTRADA = ["/sign-in", "/sign-up"] as const

function caminho(url: string): string {
    try {
        return new URL(url).pathname
    } catch {
        return url
    }
}

function dentroDe(path: string, prefixo: string): boolean {
    return path === prefixo || path.startsWith(`${prefixo}/`)
}

/**
 * Decide se uma visualização entra na contagem.
 *
 * `somenteEntrada` é a área logada: lá, o que não for página de entrada é uso
 * interno (admin, CRM), não audiência.
 */
export function contaComoAudiencia(
    url: string,
    { daEquipe, somenteEntrada }: { daEquipe: boolean; somenteEntrada: boolean }
): boolean {
    if (daEquipe) return false
    if (!somenteEntrada) return true
    const path = caminho(url)
    return PAGINAS_DE_ENTRADA.some((prefixo) => dentroDe(path, prefixo))
}
