import { getRequestConfig } from "next-intl/server"

const SUPPORTED_LOCALES = ["pt", "de"] as const

// PT é o locale default de todo o app (rotas sem prefixo).
// As páginas em alemão (app/de/*) pedem o locale explicitamente via
// getTranslations({ locale: "de", ... }) e NextIntlClientProvider locale="de" —
// esse locale explícito chega aqui como parâmetro e precisa ser honrado.
export default getRequestConfig(async ({ locale }) => {
    const resolved = SUPPORTED_LOCALES.includes(locale as "pt" | "de")
        ? (locale as "pt" | "de")
        : "pt"

    return {
        locale: resolved,
        messages: (await import(`../messages/${resolved}.json`)).default,
    }
})
