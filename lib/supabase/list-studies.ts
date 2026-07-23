// lib/supabase/list-studies.ts
import { createAdminClient } from "@/lib/supabase/admin"

export const LIST_STUDIES_BUCKET = "list-studies"
const MAX_PDF_SIZE = 50 * 1024 * 1024 // 50MB — alinhado ao teto por arquivo do bucket

export function validatePdfFile(file: { type: string; size: number }):
    | { ok: true }
    | { ok: false; error: string } {
    if (file.type !== "application/pdf") {
        return { ok: false, error: "Formato inválido. Envie um arquivo PDF." }
    }
    if (file.size > MAX_PDF_SIZE) {
        return { ok: false, error: "Arquivo muito grande. Máximo 50MB." }
    }
    return { ok: true }
}

/** Extrai o caminho relativo ao bucket a partir de uma URL de storage ou de um caminho. */
export function extractStudyPathFromUrl(publicOrPath: string): string {
    const marker = `/${LIST_STUDIES_BUCKET}/`
    const idx = publicOrPath.indexOf(marker)
    if (idx === -1) return publicOrPath
    const afterBucket = publicOrPath.slice(idx + marker.length)
    return afterBucket.split("?")[0]
}

export async function uploadListPdf(
    file: File,
    listId: string
): Promise<{ url: string; path: string }> {
    const supabase = createAdminClient()
    const path = `${listId}/study-${Date.now()}.pdf`

    // Remove PDFs anteriores da lista.
    const { data: existing } = await supabase.storage.from(LIST_STUDIES_BUCKET).list(listId)
    if (existing && existing.length > 0) {
        await supabase.storage
            .from(LIST_STUDIES_BUCKET)
            .remove(existing.map((f) => `${listId}/${f.name}`))
    }

    const { error } = await supabase.storage
        .from(LIST_STUDIES_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: "application/pdf" })

    if (error) throw new Error(`Falha no upload do PDF: ${error.message}`)

    return { url: path, path }
}

export async function removeListPdfByPath(path: string): Promise<void> {
    const supabase = createAdminClient()
    await supabase.storage.from(LIST_STUDIES_BUCKET).remove([extractStudyPathFromUrl(path)])
}

export async function createStudySignedUrl(
    path: string,
    expiresInSeconds = 120
): Promise<string> {
    const supabase = createAdminClient()
    const { data, error } = await supabase.storage
        .from(LIST_STUDIES_BUCKET)
        .createSignedUrl(extractStudyPathFromUrl(path), expiresInSeconds)

    if (error || !data) throw new Error(`Falha ao gerar link do PDF: ${error?.message}`)
    return data.signedUrl
}
