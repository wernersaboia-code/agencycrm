// lib/supabase/free-sample.ts
import { createAdminClient } from "@/lib/supabase/admin"

export const FREE_SAMPLE_BUCKET = "free-sample"

/** Extrai o caminho relativo ao bucket a partir de uma URL de storage ou de um caminho. */
export function extractFreeSamplePath(publicOrPath: string): string {
    const marker = `/${FREE_SAMPLE_BUCKET}/`
    const idx = publicOrPath.indexOf(marker)
    if (idx === -1) return publicOrPath
    return publicOrPath.slice(idx + marker.length).split("?")[0]
}

/**
 * Sobe o PDF da amostra. O nome carrega timestamp para não colidir com o
 * arquivo anterior enquanto ele ainda está sendo servido.
 */
export async function uploadFreeSample(file: File): Promise<{ path: string }> {
    const supabase = createAdminClient()
    const path = `sample-${Date.now()}.pdf`

    const { error } = await supabase.storage
        .from(FREE_SAMPLE_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: "application/pdf" })

    if (error) throw new Error(`Falha no upload da amostra: ${error.message}`)

    return { path }
}

export async function removeFreeSample(path: string): Promise<void> {
    const supabase = createAdminClient()
    await supabase.storage.from(FREE_SAMPLE_BUCKET).remove([extractFreeSamplePath(path)])
}

/**
 * URL assinada para o download imediato, logo após o envio do formulário.
 *
 * 120 s serve para o navegador começar a baixar e não serve para o e-mail —
 * é por isso que a cópia por e-mail leva `/free-sample/<token>`, que gera uma
 * URL nova na hora em que o link é aberto.
 */
export async function createFreeSampleSignedUrl(
    path: string,
    expiresInSeconds = 120
): Promise<string> {
    const supabase = createAdminClient()
    const { data, error } = await supabase.storage
        .from(FREE_SAMPLE_BUCKET)
        .createSignedUrl(extractFreeSamplePath(path), expiresInSeconds)

    if (error || !data) throw new Error(`Falha ao gerar link da amostra: ${error?.message}`)
    return data.signedUrl
}
