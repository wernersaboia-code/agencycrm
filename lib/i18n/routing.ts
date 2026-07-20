import { defineRouting } from "next-intl/routing"
import { LOCALES, DEFAULT_LOCALE } from "./locales"

export const routing = defineRouting({
    locales: LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    // O locale padrão não recebe prefixo: "/catalog" é PT, "/de/catalog" é DE.
    // Preserva todas as URLs já indexadas.
    localePrefix: "as-needed",
})
