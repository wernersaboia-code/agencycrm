import { PUBLISHED_LOCALES, type Locale } from "@/lib/i18n/locales"

/**
 * `LOCALES` inclui locales roteáveis sem tradução própria (hoje "ar"), que
 * caem no fallback para pt. Eles respondem 200 servindo português — se forem
 * indexáveis, viram conteúdo duplicado anunciado como outro idioma.
 *
 * `follow: true` de propósito: não queremos indexar a página, mas os links
 * dela apontam para páginas legítimas que devem seguir sendo rastreadas.
 */
export function isPublishedLocale(locale: string): boolean {
    return (PUBLISHED_LOCALES as readonly string[]).includes(locale as Locale)
}

export function robotsForLocale(locale: string): { index: boolean; follow: boolean } {
    return { index: isPublishedLocale(locale), follow: true }
}

/**
 * Para o ramo de "não encontrado" do generateMetadata de rotas dinâmicas
 * públicas (hoje /list/[slug] e /blog/[slug]).
 *
 * Chamar notFound() faz o Next injetar seu próprio <meta robots="noindex">,
 * mas o layout raiz declara `index, follow` — e as duas tags saíam juntas no
 * HTML, uma contradizendo a outra. Na prática o Google aplica a mais
 * restritiva, então a página não era indexada; ainda assim duas diretivas
 * conflitantes são ambíguas para outros rastreadores e escondem a intenção de
 * quem lê o código.
 *
 * Declarar no generateMetadata da própria rota faz ela vencer a herança do
 * layout. Continuam saindo duas tags — a do Next não dá para suprimir — mas
 * agora dizem a mesma coisa: `noindex` e `noindex, follow`.
 *
 * Não resolve o status HTTP: a página segue respondendo 200 em vez de 404,
 * por uma limitação do Next com streaming já investigada e documentada. É o
 * noindex que protege, e é justamente por isso que ele precisa ser explícito.
 *
 * `follow: true` pela mesma razão de robotsForLocale: a tela de não
 * encontrado linka de volta para o catálogo, e esses links são legítimos.
 */
export const ROBOTS_NAO_ENCONTRADO = { index: false, follow: true }
