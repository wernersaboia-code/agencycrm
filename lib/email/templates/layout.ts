// lib/email/templates/layout.ts
//
// A casca comum dos e-mails que o Easy Prospect manda em nome proprio.
//
// Nasceu de dentro de purchase-confirmation.ts: com tres e-mails na mesma
// marca, manter tres copias do cabecalho significaria que trocar a logo ou a
// cor exigiria lembrar de tres lugares — e o terceiro sempre fica para tras.

import { getPublicAppUrl } from "@/lib/env"

// Escapa dado de usuario antes de entrar no HTML do e-mail. Quem preenche
// nome no cadastro nao e o destinatario: e-mail de confirmacao e de conta
// existente vao para o dono do endereco digitado, entao um <a href=...> no
// nome viraria phishing hospedado no nosso remetente. So aplica em dado, nunca
// no HTML do template nem nos textos de messages/*.json.
// A ordem importa: "&" tem que ser o primeiro, senao a troca dos outros
// caracteres criaria entidades (ex.: "<" -> "&lt;") que um "&" escapado depois
// corromperia de volta.
export function escapeHtml(valor: string): string {
    return valor
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;")
}

export interface EmailLayoutParams {
    /** Titulo grande no cabecalho colorido. */
    heading: string
    /** Linha de assinatura sob o titulo. */
    tagline: string
    /** Linha de suporte no rodape. */
    support: string
    /** Miolo ja renderizado, entre o cabecalho e o rodape. */
    bodyHtml: string
}

export function renderEmailLayout(params: EmailLayoutParams): string {
    const appUrl = getPublicAppUrl()

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">

          <tr>
            <td style="padding: 40px 40px 24px; text-align: center; background: linear-gradient(135deg, #003048 0%, #0C4160 100%); border-radius: 16px 16px 0 0;">
              <!-- A maioria dos clientes de e-mail bloqueia imagem remota por
                   padrão, então o nome vem em texto logo abaixo: se a logo não
                   carregar, o cabeçalho continua identificando o remetente. -->
              <img src="${appUrl}/logo-icon.png" width="56" height="56" alt="Easy Prospect"
                   style="display: block; margin: 0 auto 16px; border-radius: 12px;" />
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px;">${params.heading}</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">${params.tagline}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              ${params.bodyHtml}

              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 13px; margin: 0;">
                  ${params.support}<br>
                  ${params.tagline}
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

/** Botao principal, na cor da marca. Repetido nos tres e-mails. */
export function renderEmailButton(href: string, label: string): string {
    return `
                <a href="${href}"
                   style="display: inline-block; background-color: #2ec4b6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(46, 196, 182, 0.3);">
                  ${label}
                </a>
  `
}
