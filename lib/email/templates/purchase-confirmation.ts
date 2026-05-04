// lib/email/templates/purchase-confirmation.ts
import { getPublicAppUrl } from "@/lib/env"

interface PurchaseConfirmationTemplateData {
    userName: string
    purchaseId: string
    purchaseDate: Date
    total: number
    currency: string
    items: Array<{
        name: string
        leadsCount: number
        price: number
    }>
    accessUrl: string
}

export function generatePurchaseConfirmationEmail(
    data: PurchaseConfirmationTemplateData
): { subject: string; html: string } {
    const appUrl = getPublicAppUrl()
    const formattedDate = data.purchaseDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })

    const formattedTotal = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: data.currency,
    }).format(data.total)

    const itemsHtml = data.items
        .map(
            (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong style="color: #111827;">${item.name}</strong><br>
        <span style="color: #6b7280; font-size: 13px;">${item.leadsCount} leads</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        <strong style="color: #111827;">
          ${new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: data.currency,
            }).format(item.price)}
        </strong>
      </td>
    </tr>
  `
        )
        .join("")

    const subject = `🎉 Sua compra no Easy Prospect foi confirmada! #${data.purchaseId.slice(0, 8)}`

    const html = `
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
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #4a2c5a 0%, #5d3a70 100%); border-radius: 16px 16px 0 0;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px;">🎉 Compra Confirmada!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">Easy Prospect - Marketplace de Leads B2B</p>
            </td>
          </tr>
          
          <!-- Conteúdo -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Saudação -->
              <p style="color: #111827; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                Olá <strong>${data.userName}</strong>,<br><br>
                Seu pagamento foi confirmado e suas listas estão prontas para download! 
                Agradecemos pela confiança em nosso marketplace.
              </p>
              
              <!-- Card de Resumo -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="33%" style="padding-bottom: 16px;">
                      <span style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px;">Pedido</span>
                      <strong style="color: #111827; font-size: 16px;">#${data.purchaseId.slice(0, 8)}</strong>
                    </td>
                    <td width="33%" style="padding-bottom: 16px;">
                      <span style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px;">Data</span>
                      <strong style="color: #111827; font-size: 16px;">${formattedDate}</strong>
                    </td>
                    <td width="33%" style="padding-bottom: 16px; text-align: right;">
                      <span style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 4px;">Total</span>
                      <strong style="color: #2ec4b6; font-size: 20px;">${formattedTotal}</strong>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Itens Comprados -->
              <h2 style="color: #4a2c5a; font-size: 18px; margin: 0 0 16px;">📦 Itens Comprados</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
                ${itemsHtml}
              </table>
              
              <!-- Botão de Acesso -->
              <div style="text-align: center; margin-bottom: 32px;">
                <p style="color: #374151; font-size: 15px; margin: 0 0 20px;">
                  Clique no botão abaixo para acessar sua área de compras e fazer download das listas:
                </p>
                
                <a href="${data.accessUrl}" 
                   style="display: inline-block; background-color: #2ec4b6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(46, 196, 182, 0.3);">
                  Acessar Minhas Compras →
                </a>
                
                <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0;">
                  🔒 Este link é pessoal e válido por 24 horas
                </p>
              </div>
              
              <!-- CTA CRM -->
              <div style="background: linear-gradient(135deg, #2ec4b6 0%, #1ba399 100%); border-radius: 12px; padding: 24px; text-align: center; margin-top: 24px;">
                <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 8px;">🚀 Potencialize seus resultados!</h3>
                <p style="color: rgba(255,255,255,0.95); font-size: 14px; margin: 0 0 16px;">
                  Use nosso CRM gratuito para gerenciar campanhas, enviar emails e fazer ligações
                </p>
                <a href="${appUrl}/dashboard" 
                   style="display: inline-block; background-color: #ffffff; color: #2ec4b6; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  Acessar CRM Grátis →
                </a>
              </div>
              
              <!-- Suporte -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 13px; margin: 0;">
                  Dúvidas? Responda este email ou entre em contato pelo suporte.<br>
                  Easy Prospect - O marketplace de leads B2B para comércio exterior
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

    return { subject, html }
}
