/**
 * Resolução de para onde o login leva a pessoa.
 *
 * A tela de login pede que a área seja escolhida ANTES de autenticar, então o
 * destino é sempre um palpite feito sem saber quem é o usuário. Quando o
 * palpite erra, o layout de destino expulsa a pessoa de volta e a tela parece
 * não ter reagido — foi exatamente o que acontecia com o padrão anterior, que
 * mandava todo mundo para a Área Administrativa.
 */

export type AccessAreaId = "crm" | "purchases" | "admin"

/**
 * Área assumida quando não há nada na URL indicando o destino.
 *
 * É "purchases" porque esse é o caminho de quem compra no marketplace — a
 * maioria. Administração jamais pode ser o padrão: exige papel ADMIN, que
 * quase ninguém tem, e quem não tem é rejeitado no destino.
 */
export const DEFAULT_ACCESS_AREA: AccessAreaId = "purchases"

/** Para onde cai quem tentou uma área que o papel dele não alcança. */
export const FALLBACK_REDIRECT = "/my-purchases"

export function normalizeRedirect(path: string): string {
    if (path === "/crm" || path === "/crm/dashboard") {
        return "/dashboard"
    }

    if (path.startsWith("/crm/")) {
        return path.replace(/^\/crm/, "")
    }

    return path
}

export function getAreaFromRedirect(
    redirect: string | null,
    from: string | null
): AccessAreaId {
    if (from === "marketplace") {
        return "purchases"
    }

    if (!redirect) {
        return DEFAULT_ACCESS_AREA
    }

    const normalizedRedirect = normalizeRedirect(redirect)

    if (
        normalizedRedirect === "/my-purchases" ||
        normalizedRedirect.startsWith("/my-purchases/") ||
        normalizedRedirect.startsWith("/checkout") ||
        normalizedRedirect.startsWith("/cart")
    ) {
        return "purchases"
    }

    if (normalizedRedirect === "/super-admin" || normalizedRedirect.startsWith("/super-admin/")) {
        return "admin"
    }

    return "crm"
}

export function isAdminDestination(path: string): boolean {
    return path === "/super-admin" || path.startsWith("/super-admin/")
}

/**
 * Última barreira antes de navegar: corrige o destino quando o papel real do
 * usuário não alcança o que a tela prometeu. Sem isto, mandar um USER para
 * /super-admin faz o layout de lá devolvê-lo, e o usuário volta ao ponto de
 * partida sem nenhuma mensagem explicando o quê.
 */
export function resolvePostLoginRedirect(
    intended: string,
    role: string | null
): string {
    if (isAdminDestination(intended) && role !== "ADMIN") {
        return FALLBACK_REDIRECT
    }

    return intended
}
