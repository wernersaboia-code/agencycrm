/**
 * Compõe um `where` de Prisma que exige que o recurso pertença a um workspace
 * do usuário. Usado por actions que resolvem recursos por id e precisam
 * garantir o escopo do dono antes de ler/mutar.
 */
export function buildOwnedWhere(
    userId: string,
    extra: Record<string, unknown> = {}
) {
    return {
        ...extra,
        workspace: { userId },
    }
}
