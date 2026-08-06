// lib/i18n/user-locale.ts
//
// O idioma de um usuario, lido de User.language.
//
// Existe como funcao unica porque a coluna guarda historia: nasceu com o
// default "pt-BR", que nao e um locale nosso, e admin-locale.ts ja dependia
// dela cair no padrao por acidente. Concentrar a leitura aqui significa que o
// dia em que o formato mudar de novo, muda num lugar so.

import { DEFAULT_LOCALE, isLocale, resolveMessagesLocale, type Locale } from "@/lib/i18n/locales"

/**
 * Devolve sempre um locale PUBLICADO, tolerando valor ausente, mal formado ou
 * de um idioma sem traducao. E-mail com chave crua no lugar do texto e pior
 * para o comprador do que e-mail no idioma padrao.
 */
export function localeFromUserLanguage(language: string | null | undefined): Locale {
    if (!language) {
        return DEFAULT_LOCALE
    }

    const base = language.split("-")[0].toLowerCase()

    if (!isLocale(base)) {
        return DEFAULT_LOCALE
    }

    return resolveMessagesLocale(base)
}
