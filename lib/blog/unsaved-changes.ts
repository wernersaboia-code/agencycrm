// lib/blog/unsaved-changes.ts

// Converte um ISO/UTC para o formato de <input type="datetime-local"> no fuso
// LOCAL do navegador (YYYY-MM-DDTHH:mm). Precisa rodar no cliente.
export function toDatetimeLocalValue(iso: string): string {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export type TranslationStateLike = {
    title: string; slug: string; excerpt: string; contentHtml: string; metaDescription: string
}

/**
 * Compara o estado em edição contra o que veio do servidor, pra decidir se o
 * botão "Ver como fica" precisa avisar que a prévia está desatualizada.
 *
 * `publishedAt` merece cuidado à parte: o estado guarda o valor no formato de
 * <input type="datetime-local"> (fuso LOCAL do navegador), enquanto
 * `initial.publishedAt` é o ISO/UTC persistido. Comparar os dois direto dá
 * falso positivo sempre — os formatos nunca batem. Por isso convertemos o
 * lado do servidor com a mesma função (`toDatetimeLocalValue`) que o efeito
 * de montagem usa pra preencher o estado.
 */
export function temAlteracaoNaoSalva(params: {
    tr: Record<string, TranslationStateLike | undefined>
    initialTranslations: Record<string, TranslationStateLike | undefined>
    cover: string | null
    initialCoverImageUrl: string | null
    categoryId: string
    initialCategoryId: string | null
    status: string
    initialStatus: string
    publishedAt: string
    initialPublishedAt: string | null
}): boolean {
    const publishedAtInicial = params.initialPublishedAt
        ? toDatetimeLocalValue(params.initialPublishedAt)
        : ""

    return (
        JSON.stringify(params.tr) !== JSON.stringify(params.initialTranslations) ||
        params.cover !== params.initialCoverImageUrl ||
        params.categoryId !== (params.initialCategoryId ?? "") ||
        params.status !== params.initialStatus ||
        params.publishedAt !== publishedAtInicial
    )
}
