import { de, enUS, es, fr, it, nl, ptBR } from "date-fns/locale"
import type { Locale as DateFnsLocale } from "date-fns"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales"

/**
 * Locale do date-fns correspondente ao do app.
 *
 * As telas do super-admin importavam `ptBR` direto e passavam em toda chamada
 * de `format`/`formatDistanceToNow`. O texto ao redor podia estar em alemão e
 * a data ainda saía "há 9 dias" — visível na listagem de usuários.
 *
 * `ar` não tem tradução própria e cai no padrão, igual ao resto do i18n.
 */
const POR_LOCALE: Record<Locale, DateFnsLocale> = {
    pt: ptBR,
    en: enUS,
    de,
    es,
    fr,
    it,
    nl,
    ar: ptBR,
}

export function dateFnsLocaleFor(locale: Locale): DateFnsLocale {
    return POR_LOCALE[locale] ?? POR_LOCALE[DEFAULT_LOCALE]
}
