/**
 * Decisão pura de acesso ao super-admin, isolada do proxy para ser testável.
 *
 * O gate real vive no `proxy.ts` (Node runtime, com Prisma). Este arquivo só
 * responde "o caminho é do super-admin?" e "esta role pode entrar?".
 */

export function isSuperAdminPath(pathname: string): boolean {
    return pathname === "/super-admin" || pathname.startsWith("/super-admin/")
}

export function canAccessSuperAdmin(
    role: string | null | undefined
): boolean {
    return role === "ADMIN"
}
