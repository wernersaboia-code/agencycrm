import { DEFAULT_LOCALE, isLocale, resolveMessagesLocale, type Locale } from "@/lib/i18n/locales"

// Locale efetivo da tela de auth a partir do ?lang. A auth vive fora do
// segmento [locale], então o idioma não vem da rota — vem deste parâmetro.
// Reusa resolveMessagesLocale para cair no padrão quando o locale é roteável
// mas ainda não publicado (ver PUBLISHED_LOCALES).
export function resolveAuthLocale(lang?: string | null): Locale {
    const requested = lang && isLocale(lang) ? lang : DEFAULT_LOCALE
    return resolveMessagesLocale(requested)
}

// Query string com `lang` definido, preservando os demais params (redirect,
// from). Usado pelo seletor de idioma da auth e pelos pontos de entrada.
export function withLangParam(search: string, lang: string): string {
    const params = new URLSearchParams(search)
    params.set("lang", lang)
    return params.toString()
}
