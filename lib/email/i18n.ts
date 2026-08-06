// lib/email/i18n.ts
//
// Textos dos e-mails, por idioma.
//
// Os e-mails vivem fora do React, entao nao ha contexto do next-intl e nao da
// para usar useTranslations. O que sobra e ler o mesmo messages/<locale>.json
// que a interface usa — mesma fonte, mesma revisao de traducao — e interpolar
// na mao.
//
// A interpolacao usa a mesma sintaxe do next-intl ({nome}) de proposito: quem
// mexer numa chave de e-mail nao precisa lembrar que ali a regra e outra.

import { loadMessages } from "@/lib/i18n/load-messages"
import type { Locale } from "@/lib/i18n/locales"

export type EmailBlock = Record<string, string>

export type EmailBlockName = "signup" | "accountExists" | "purchase"

/** Troca {chave} pelo valor. Placeholder sem valor fica visivel, em vez de virar "undefined". */
export function interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (original, chave: string) => {
        return chave in vars ? vars[chave] : original
    })
}

async function emailsDe(locale: Locale): Promise<Record<string, EmailBlock>> {
    // loadMessages ja funde o locale com o portugues, entao chave sem
    // traducao cai no texto em portugues em vez de sumir do e-mail.
    const messages = (await loadMessages(locale)) as unknown as {
        emails: Record<string, EmailBlock>
    }

    return messages.emails
}

export async function loadEmailBlock(locale: Locale, block: EmailBlockName): Promise<EmailBlock> {
    return (await emailsDe(locale))[block]
}

export async function loadEmailCommon(locale: Locale): Promise<EmailBlock> {
    return (await emailsDe(locale)).common
}
