// lib/email/purchase.ts
"use server"

import { sendEmail, SmtpConfig } from "@/lib/email"
import { generatePurchaseConfirmationEmail } from "./templates/purchase-confirmation"
import { prisma } from "@/lib/prisma"
import { SMTP_PROVIDERS } from "@/lib/constants/smtp.constants"
import { decryptSecret } from "@/lib/secrets"

interface SendPurchaseConfirmationParams {
    userId: string
    purchaseId: string
    accessToken: string
    accessUrl: string
}

// 🆕 Função para obter configuração SMTP padrão do sistema
function getSystemSmtpConfig(): SmtpConfig {
    // Verificar se tem SMTP configurado no .env
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log("📧 Usando SMTP do sistema (.env)")
        return {
            provider: "custom",
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
            secure: process.env.SMTP_SECURE === "true",
            senderName: process.env.SMTP_FROM_NAME || "Easy Prospect",
            senderEmail: process.env.SMTP_FROM_EMAIL || "compras@easyprospect.com",
        }
    }

    // Fallback: Tentar usar Gmail com credenciais do .env
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        console.log("📧 Usando Gmail como fallback")
        return {
            provider: "google",
            host: SMTP_PROVIDERS.google.host,
            port: SMTP_PROVIDERS.google.port,
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
            secure: SMTP_PROVIDERS.google.secure,
            senderName: "Easy Prospect",
            senderEmail: process.env.GMAIL_USER,
        }
    }

    // Se não tiver nada, retornar configuração vazia (vai falhar)
    console.warn("⚠️ Nenhuma configuração SMTP encontrada!")
    return {
        provider: null,
        host: null,
        port: null,
        user: null,
        pass: null,
        secure: false,
        senderName: null,
        senderEmail: null,
    }
}

export async function sendPurchaseConfirmationEmail({
                                                        userId,
                                                        purchaseId,
                                                        accessToken,
                                                        accessUrl,
                                                    }: SendPurchaseConfirmationParams) {
    try {
        console.log("📧 Iniciando envio de email de confirmação...")
        console.log("  Purchase ID:", purchaseId)
        console.log("  User ID:", userId)

        // Buscar dados completos da compra
        const purchase = await prisma.purchase.findUnique({
            where: { id: purchaseId },
            include: {
                user: {
                    select: {
                        email: true,
                        name: true,
                    },
                },
                items: {
                    include: {
                        list: {
                            select: {
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        })

        if (!purchase) {
            console.error("❌ Compra não encontrada:", purchaseId)
            return { success: false, error: "Compra não encontrada" }
        }

        console.log("✅ Compra encontrada")
        console.log("  Buyer Email:", purchase.user.email)
        console.log("  Total Items:", purchase.items.length)

        // 🆕 Tentar obter SMTP do workspace do usuário
        let smtpConfig: SmtpConfig | null = null
        let workspace = await prisma.workspace.findFirst({
            where: { userId },
            select: {
                senderName: true,
                senderEmail: true,
                smtpProvider: true,
                smtpHost: true,
                smtpPort: true,
                smtpUser: true,
                smtpPass: true,
                smtpSecure: true,
            },
        })

        // Se o workspace tem SMTP configurado, usa ele
        const smtpPass = decryptSecret(workspace?.smtpPass)
        if (workspace?.smtpUser && smtpPass) {
            console.log("✅ Usando SMTP do workspace do usuário")

            const providerConfig = workspace.smtpProvider
                ? SMTP_PROVIDERS[workspace.smtpProvider as keyof typeof SMTP_PROVIDERS]
                : null

            smtpConfig = {
                provider: workspace.smtpProvider || null,
                host: workspace.smtpHost || providerConfig?.host || null,
                port: workspace.smtpPort || providerConfig?.port || 587,
                user: workspace.smtpUser,
                pass: smtpPass,
                secure: workspace.smtpSecure ?? false,
                senderName: workspace.senderName || purchase.user.name || "Easy Prospect",
                senderEmail: workspace.senderEmail || workspace.smtpUser,
            }
        } else {
            // 🆕 Se não tem workspace com SMTP, usar configuração do sistema
            console.log("📧 Workspace sem SMTP. Usando configuração do sistema...")
            smtpConfig = getSystemSmtpConfig()

            // Se mesmo assim não tem SMTP, não tem como enviar
            if (!smtpConfig.user || !smtpConfig.pass) {
                console.error("❌ Nenhuma configuração SMTP disponível!")
                console.error("   Configure SMTP no .env ou no workspace do usuário")
                return {
                    success: false,
                    error: "Serviço de email não configurado. Contate o suporte."
                }
            }
        }

        console.log("📧 Configuração SMTP:")
        console.log("  Provider:", smtpConfig.provider || "custom")
        console.log("  Host:", smtpConfig.host)
        console.log("  User:", smtpConfig.user)
        console.log("  From:", `${smtpConfig.senderName} <${smtpConfig.senderEmail}>`)

        // Gerar HTML do email
        const { subject, html } = generatePurchaseConfirmationEmail({
            userName: purchase.user.name || purchase.user.email.split("@")[0],
            purchaseId: purchase.id,
            purchaseDate: purchase.createdAt,
            total: Number(purchase.total),
            currency: purchase.currency,
            items: purchase.items.map((item) => ({
                name: item.list.name,
                leadsCount: item.leadsCount,
                price: Number(item.price),
            })),
            accessUrl,
        })

        console.log("📧 Enviando email...")
        console.log("  To:", purchase.user.email)
        console.log("  Subject:", subject)

        // Enviar email
        const result = await sendEmail(
            {
                to: purchase.user.email,
                subject,
                html,
            },
            smtpConfig
        )

        if (result.success) {
            console.log(`✅ Email de confirmação enviado com sucesso!`)
            console.log(`  Message ID:`, result.id)
            return { success: true }
        } else {
            console.error("❌ Falha ao enviar email:", result.error)
            return { success: false, error: result.error }
        }
    } catch (error) {
        console.error("❌ Erro ao enviar email de confirmação:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erro desconhecido",
        }
    }
}
