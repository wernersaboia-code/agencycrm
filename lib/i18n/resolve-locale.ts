import { isLocale, DEFAULT_LOCALE } from "./locales"
import type { Locale } from "./locales"

export function resolveSiteLocale(
    explicit: string | undefined,
    cookieValue: string | undefined
): Locale {
    if (explicit && isLocale(explicit)) return explicit
    if (cookieValue && isLocale(cookieValue)) return cookieValue
    return DEFAULT_LOCALE
}
