import { getPathname } from "./navigation"
import { DEFAULT_LOCALE, htmlLangFor, type Locale } from "./locales"
import { localesComConteudo } from "@/lib/seo/content-coverage"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.easyprospect.com.br"

/**
 * hreflang de mão dupla: cada idioma publicado lista todos os outros, e
 * x-default aponta para o padrão. Sem isto o Google trata as traduções como
 * páginas concorrentes em vez de variantes.
 *
 * A lista de idiomas não é PUBLISHED_LOCALES direto, e sim a cobertura da
 * ROTA (localesComConteudo): locale sem o conteúdo daquela página serve o
 * fallback para pt e não pode ser anunciado como variante de idioma — isso
 * sinalizaria conteúdo duplicado ao buscador. Para a maioria das rotas, cujo
 * texto vem de messages/, as duas listas coincidem.
 *
 * O caminho com prefixo de locale vem de getPathname (next-intl), o mesmo
 * mecanismo usado em app/sitemap.ts — evita ter duas implementações da
 * mesma regra de prefixo.
 *
 * Usado nas rotas estáticas E nas páginas de lista. As listas antes
 * canonicalizavam todas as variantes para a URL pt (sem hreflang); a medição
 * com a URL Inspection API mostrou que o Google ignorava esse canonical e
 * indexava 322 variantes mesmo assim, deixando 31 canônicas de fora. Cada
 * variante passa a ter canonical próprio + hreflang recíproco: os sinais
 * apontam para a mesma família de páginas em vez de se dividirem.
 */
export function alternatesFor(
    path: string,
    current: Locale = DEFAULT_LOCALE,
    // Cobertura explícita, para a rota cuja lista de idiomas vem do banco e
    // não de um mapa estático: hoje só o índice do blog, que existe de
    // verdade nos idiomas em que há post publicado. Quem chama já fez a
    // consulta (app/sitemap.ts) e passa o resultado.
    cobertura?: readonly Locale[]
): { canonical: string; languages?: Record<string, string> } {
    // O idioma atual não tem o conteúdo desta rota (só o fallback para pt):
    // canonical próprio e nenhum hreflang. Um par de hreflang precisa se
    // autorreferenciar para ser válido, e esta página está fora do grupo —
    // anunciar as outras sem estar entre elas seria um cluster quebrado. Ela
    // sai também do sitemap e ganha noindex (ver lib/seo/indexability), então
    // o canonical próprio aqui não contradiz nada: só evita o par
    // "noindex + canonical apontando para outra página", que é ambíguo.
    const idiomas = cobertura ?? localesComConteudo(path)

    if (!idiomas.includes(current)) {
        return { canonical: `${BASE_URL}${getPathname({ href: path, locale: current })}` }
    }

    const languages: Record<string, string> = {}
    for (const locale of idiomas) {
        languages[htmlLangFor(locale)] = `${BASE_URL}${getPathname({ href: path, locale })}`
    }
    languages["x-default"] = `${BASE_URL}${getPathname({ href: path, locale: DEFAULT_LOCALE })}`

    return { canonical: `${BASE_URL}${getPathname({ href: path, locale: current })}`, languages }
}
