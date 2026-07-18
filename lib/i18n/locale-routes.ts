import type { SiteLocale } from "./resolve-locale"

// Só as landings têm rota própria por idioma. O resto do funil (catálogo,
// detalhe da lista, carrinho, checkout) usa o mesmo caminho nos dois locales e
// se traduz pelo cookie — por isso a troca de idioma mantém o usuário no lugar
// em vez de jogá-lo na home.
const PT_TO_DE: Record<string, string> = {
    "/": "/de",
    "/faq": "/de/faq",
}

const DE_TO_PT: Record<string, string> = {
    "/de": "/",
    "/de/faq": "/faq",
}

export function localeTargetPath(pathname: string, target: SiteLocale): string {
    const mapped = target === "de" ? PT_TO_DE[pathname] : DE_TO_PT[pathname]
    if (mapped) return mapped

    // Rota exclusiva de /de sem par em PT: a home é o único destino seguro.
    if (target === "pt" && pathname.startsWith("/de")) return "/"

    // Rota compartilhada: fica onde está e apenas troca o idioma.
    return pathname
}
