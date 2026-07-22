/**
 * Exceções à exigência de workspace no CRM.
 *
 * O layout do CRM manda quem não tem workspace para /workspaces, e quem está
 * com trial vencido para /trial-expired. Como as duas páginas moram dentro do
 * próprio grupo (crm), elas herdam esse mesmo layout — que roda de novo, não
 * acha workspace, e redireciona outra vez. A saída de emergência ficava atrás
 * da porta que ela deveria destrancar.
 *
 * Estas são exatamente as telas que existem para consertar o estado que a
 * guarda reclama, então precisam ficar fora dela.
 */

export const ROTAS_SEM_GUARDA_DE_WORKSPACE = ["/workspaces", "/trial-expired"] as const

export function isRotaDeEscapeDoWorkspace(pathname: string | null): boolean {
    if (!pathname) {
        return false
    }

    // Sem query string nem barra final, para "/workspaces?message=create-first"
    // e "/workspaces/" caírem no mesmo caso.
    const limpo = pathname.split("?")[0].replace(/\/+$/, "") || "/"

    return ROTAS_SEM_GUARDA_DE_WORKSPACE.some(
        (rota) => limpo === rota || limpo.startsWith(`${rota}/`)
    )
}
