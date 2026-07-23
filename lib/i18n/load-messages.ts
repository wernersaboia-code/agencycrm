import type { AbstractIntlMessages } from "next-intl"
import type { Locale } from "@/lib/i18n/locales"

// Carrega o pacote de mensagens de um locale publicado. Caminho relativo (não
// alias) para o import dinâmico funcionar no bundler, igual a i18n/request.ts.
export async function loadMessages(locale: Locale): Promise<AbstractIntlMessages> {
    return (await import(`../../messages/${locale}.json`)).default
}
