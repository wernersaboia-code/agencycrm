/**
 * Três páginas do MIOLO da amostra, para ilustrar "o que está incluído" na home.
 *
 * Pula a capa (índice 0): ela já abre o folhear do hero, e o que a seção
 * promete — análise, canais, perfis — está nas páginas de dentro. Com menos de
 * quatro páginas não há miolo que valha mostrar, e a seção fica só com o texto.
 */
export function escolherFolhas(paginas: readonly string[]): string[] {
    if (paginas.length < 4) return []
    const ultimo = paginas.length - 1

    return [paginas[1], paginas[Math.round(ultimo / 2)], paginas[ultimo]]
}
