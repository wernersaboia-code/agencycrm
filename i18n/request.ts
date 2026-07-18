import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"
import { resolveSiteLocale } from "@/lib/i18n/resolve-locale"

// PT é o locale default de todo o app (rotas sem prefixo).
// As páginas em alemão (app/de/*) pedem o locale explicitamente via
// getTranslations({ locale: "de", ... }) e NextIntlClientProvider locale="de" —
// esse locale explícito chega aqui como parâmetro e precisa ser honrado.
// Quando não há locale explícito, o funil (catálogo/carrinho/checkout) resolve
// pelo cookie NEXT_LOCALE, gravado por setLocaleCookie / SyncLocaleCookie.
export default getRequestConfig(async ({ locale }) => {
    const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value
    const resolved = resolveSiteLocale(locale, cookieLocale)

    return {
        locale: resolved,
        messages: (await import(`../messages/${resolved}.json`)).default,
    }
})
