// lib/email/templates/account-exists.ts
//
// E-mail de "voce ja tem uma conta".
//
// Existe por causa de uma escolha de seguranca: a rota de cadastro responde
// IGUAL para e-mail novo e e-mail ja cadastrado, senao qualquer um descobriria
// quem e cliente testando enderecos. O silencio na resposta se paga com este
// aviso, que vai para o dono do endereco.
//
// Sem token e sem nome de proposito: quem disparou o cadastro pode ser um
// terceiro, e nem o link de confirmacao nem o nome digitado por ele tem o que
// fazer na caixa do titular.

import type { Locale } from "@/lib/i18n/locales"
import { loadEmailBlock, loadEmailCommon } from "@/lib/email/i18n"
import { renderEmailLayout, renderEmailButton } from "./layout"

export async function generateAccountExistsEmail(
    data: { signInUrl: string },
    locale: Locale
): Promise<{ subject: string; html: string }> {
    const t = await loadEmailBlock(locale, "accountExists")
    const comum = await loadEmailCommon(locale)

    const bodyHtml = `
              <p style="color: #111827; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                ${t.greeting}<br><br>
                ${t.intro}
              </p>

              <div style="text-align: center; margin-bottom: 32px;">
                ${renderEmailButton(data.signInUrl, t.button)}
                <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0;">${t.resetHint}</p>
              </div>

              <p style="color: #6b7280; font-size: 13px; margin: 0;">${t.ignore}</p>
  `

    return {
        subject: t.subject,
        html: renderEmailLayout({
            heading: t.heading,
            tagline: comum.tagline,
            support: comum.support,
            bodyHtml,
        }),
    }
}
