// lib/auth/magic-link.ts
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import { addHours } from "date-fns"

/**
 * Gera um token de acesso para compras
 * @param userId - ID do usuário
 * @param purchaseId - ID da compra (opcional - se não informado, dá acesso a todas)
 * @param validityHours - Horas de validade (default: 24)
 */
export async function generatePurchaseAccessToken(
    userId: string,
    purchaseId?: string,
    validityHours: number = 24
): Promise<string> {
    const token = randomBytes(32).toString("hex")
    const expiresAt = addHours(new Date(), validityHours)

    await prisma.purchaseAccessToken.create({
        data: {
            token,
            userId,
            purchaseId,
            expiresAt,
        },
    })

    return token
}

/**
 * Valida um token de acesso e retorna o usuário associado
 */
export async function validatePurchaseAccessToken(token: string) {
    const accessToken = await prisma.purchaseAccessToken.findUnique({
        where: { token },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
            },
        },
    })

    if (!accessToken) {
        return { valid: false, error: "Token não encontrado" }
    }

    if (accessToken.expiresAt < new Date()) {
        return { valid: false, error: "Token expirado" }
    }

    if (accessToken.usedAt) {
        return { valid: false, error: "Token já utilizado" }
    }

    // Marcar como usado (single-use)
    await prisma.purchaseAccessToken.update({
        where: { id: accessToken.id },
        data: { usedAt: new Date() },
    })

    return {
        valid: true,
        user: accessToken.user,
        purchaseId: accessToken.purchaseId,
    }
}

/**
 * Gera URL de acesso mágico
 */
export function generateMagicLinkUrl(token: string, baseUrl?: string): string {
    const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    return `${appUrl}/my-purchases?token=${token}`
}