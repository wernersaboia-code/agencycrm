import { getPathname } from "./navigation"
import { PUBLISHED_LOCALES, DEFAULT_LOCALE, htmlLangFor, type Locale } from "./locales"
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

    // Defesa para um locale roteável (LOCALES) que ainda não tenha tradução
    // própria (PUBLISHED_LOCALES) — situação do árabe até a fase 4 da
    // expansão de idiomas, hoje sem exemplo real porque os dois conjuntos
    // coincidem. Sem esta guarda, a página de um locale nesse estado
    // autodeclara canonical para si mesma servindo o fallback para pt — uma
    // duplicata órfã, sem hreflang ligando as duas, porque o loop acima só
    // cobre PUBLISHED_LOCALES. Aponta para a versão publicada mais próxima
    // em vez disso, e volta a valer no próximo idioma que entrar assim.
    const canonicalLocale = PUBLISHED_LOCALES.includes(current) ? current : DEFAULT_LOCALE

    return { canonical: `${BASE_URL}${getPathname({ href: path, locale: canonicalLocale })}`, languages }
}

/**
 * Canonical único, sem hreflang, sempre na URL do locale padrão.
 *
 * Para páginas roteáveis em todos os locales mas com um só idioma de
 * conteúdo — hoje as listas do marketplace: nome, descrição, tabela de
 * amostra e leads vêm do banco num idioma só; as versões com prefixo
 * (/de/list, /fr/list…) traduzem apenas a interface em volta. Anunciá-las
 * com hreflang recíproco fazia o Google ver 7 quase-duplicatas por lista e
 * empilhá-las em "Detectada, mas não indexada". Apontando todas as variantes
 * para a mesma URL, o buscador consolida os sinais numa página só. Sem
 * `languages` aqui de propósito: com o canonical cruzando para outra URL, o
 * Google ignora o par hreflang de qualquer forma.
 */
export function canonicalDefaultLocale(path: string) {
    return { canonical: `${BASE_URL}${getPathname({ href: path, locale: DEFAULT_LOCALE })}` }
}
