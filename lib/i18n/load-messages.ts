import type { AbstractIntlMessages } from "next-intl"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales"
import { mergeMessages, type Messages } from "@/lib/i18n/merge-messages"

// Carrega o pacote de mensagens de um locale publicado. Caminho relativo (não
// alias) para o import dinâmico funcionar no bundler, igual a i18n/request.ts.
//
// Chave sem tradução cai no português em vez de aparecer como caminho cru na
// tela. É o caso hoje do namespace `admin` (o super-admin só tem pt e en):
// quem tem o idioma da conta em de/es/fr/it/nl veria "admin.common.save"
// escrito na interface. Ver o teste de paridade em messages-integridade.
export async function loadMessages(locale: Locale): Promise<AbstractIntlMessages> {
    const messages = (await import(`../../messages/${locale}.json`)).default as Messages

    if (locale === DEFAULT_LOCALE) {
        return messages
    }

    const fallback = (await import(`../../messages/${DEFAULT_LOCALE}.json`)).default as Messages

    return mergeMessages(fallback, messages)
}
