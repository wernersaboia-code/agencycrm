// lib/email/templates/purchase-confirmation.ts
//
// E-mail de confirmacao de compra, no idioma do comprador.
//
// Era fixo em portugues, com toLocaleDateString("pt-BR") cravado — e o mercado
// principal e a Alemanha. O locale entra como parametro em vez de sair de uma
// variavel global porque o webhook do provedor chega sem sessao: quem sabe o
// idioma e a Purchase, via User.language.

import { getPublicAppUrl } from "@/lib/env"
import { htmlLangFor, type Locale } from "@/lib/i18n/locales"
import { loadEmailBlock, loadEmailCommon, interpolate } from "@/lib/email/i18n"
import { renderEmailLayout, renderEmailButton, escapeHtml } from "./layout"

interface PurchaseConfirmationTemplateData {
    userName: string
    purchaseId: string
    purchaseDate: Date
    total: number
    currency: string
    items: Array<{
        name: string
        price: number
    }>
    accessUrl: string
}

export async function generatePurchaseConfirmationEmail(
    data: PurchaseConfirmationTemplateData,
    locale: Locale
): Promise<{ subject: string; html: string }> {
    const appUrl = getPublicAppUrl()
    const t = await loadEmailBlock(locale, "purchase")
    const comum = await loadEmailCommon(locale)

    // htmlLangFor devolve a tag BCP 47 ("de" -> "de-DE"), que e o que o Intl
    // exige: "de" sozinho nao define separador decimal nem formato de data.
    const tagIntl = htmlLangFor(locale)

    const formattedDate = data.purchaseDate.toLocaleDateString(tagIntl, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })

    const dinheiro = new Intl.NumberFormat(tagIntl, {
        style: "currency",
        currency: data.currency,
    })

    const numeroCurto = data.purchaseId.slice(0, 8)

    const itemsHtml = data.items
        .map(
            (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong style="color: #111827;">${escapeHtml(item.name)}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        <strong style="color: #111827;">${dinheiro.format(item.price)}</strong>
      </td>
    </tr>
  `
        )
        .join("")

    const subject = interpolate(t.subject, { pedido: numeroCurto })

    const bodyHtml = `
              <p style="color: #111827; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                ${interpolate(t.greeting, { nome: escapeHtml(data.userName) })}<br><br>
                ${t.intro}
              </p>

              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="33%" style="padding-bottom: 16px;">
                      <span style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px;">${t.orderLabel}</span>
                      <strong style="color: #111827; font-size: 16px;">#${numeroCurto}</strong>
                    </td>
                    <td width="33%" style="padding-bottom: 16px;">
                      <span style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px;">${t.dateLabel}</span>
                      <strong style="color: #111827; font-size: 16px;">${formattedDate}</strong>
                    </td>
                    <td width="33%" style="padding-bottom: 16px; text-align: right;">
                      <span style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px;">${t.totalLabel}</span>
                      <strong style="color: #2ec4b6; font-size: 20px;">${dinheiro.format(data.total)}</strong>
                    </td>
                  </tr>
                </table>
              </div>

              <h2 style="color: #4a2c5a; font-size: 18px; margin: 0 0 16px;">${t.itemsTitle}</h2>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
                ${itemsHtml}
              </table>

              <div style="text-align: center; margin-bottom: 32px;">
                <p style="color: #374151; font-size: 15px; margin: 0 0 20px;">${t.accessIntro}</p>
                ${renderEmailButton(data.accessUrl, t.accessButton)}
                <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0;">🔒 ${t.linkNote}</p>
              </div>

              <div style="background: linear-gradient(135deg, #003048 0%, #0C4160 100%); border-radius: 8px; padding: 24px; text-align: center; margin-top: 24px;">
                <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 8px;">${t.catalogTitle}</h3>
                <p style="color: rgba(255,255,255,0.95); font-size: 14px; margin: 0 0 16px;">${t.catalogText}</p>
                <a href="${appUrl}/catalog"
                   style="display: inline-block; background-color: #ffffff; color: #003048; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  ${t.catalogButton}
                </a>
              </div>
  `

    return {
        subject,
        html: renderEmailLayout({
            heading: t.heading,
            tagline: comum.tagline,
            support: comum.support,
            bodyHtml,
        }),
    }
}
