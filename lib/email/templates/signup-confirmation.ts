// lib/email/templates/signup-confirmation.ts
//
// E-mail de confirmacao de cadastro.
//
// Ate aqui quem mandava era o Supabase, com o template do painel: um so, em
// ingles de fabrica, fora do git. Este passa a sair pelo nosso SMTP, no idioma
// que a pessoa escolheu na tela.

import type { Locale } from "@/lib/i18n/locales"
import { loadEmailBlock, loadEmailCommon, interpolate } from "@/lib/email/i18n"
import { renderEmailLayout, renderEmailButton, escapeHtml } from "./layout"

export async function generateSignupConfirmationEmail(
    data: { userName: string; confirmUrl: string },
    locale: Locale
): Promise<{ subject: string; html: string }> {
    const t = await loadEmailBlock(locale, "signup")
    const comum = await loadEmailCommon(locale)

    const bodyHtml = `
              <p style="color: #111827; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                ${interpolate(t.greeting, { nome: escapeHtml(data.userName) })}<br><br>
                ${t.intro}
              </p>

              <div style="text-align: center; margin-bottom: 32px;">
                ${renderEmailButton(data.confirmUrl, t.button)}
                <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0;">🔒 ${t.expires}</p>
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
