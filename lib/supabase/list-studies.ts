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

    const { error } = await supabase.storage
        .from(LIST_STUDIES_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: "application/pdf" })

    if (error) throw new Error(`Falha no upload do PDF: ${error.message}`)

    // Remove PDFs antigos da lista somente depois do novo upload ter sucesso.
    const { data: existing } = await supabase.storage.from(LIST_STUDIES_BUCKET).list(listId)
    if (existing && existing.length > 0) {
        const stale = existing
            .map((f) => `${listId}/${f.name}`)
            .filter((p) => p !== path)
        if (stale.length > 0) {
            await supabase.storage.from(LIST_STUDIES_BUCKET).remove(stale)
        }
    }

    return { url: path, path }
}

export async function removeListPdfByPath(path: string): Promise<void> {
    const supabase = createAdminClient()
    await supabase.storage.from(LIST_STUDIES_BUCKET).remove([extractStudyPathFromUrl(path)])
}

/**
 * Nome com que o comprador recebe o PDF do estudo.
 *
 * A chave do storage ("study-1760000000000.pdf") não diz nada na pasta de
 * downloads de ninguém. O nome sai do nome do estudo, sem acento e sem nada
 * que um sistema de arquivos ou um cabeçalho Content-Disposition estranhe:
 * "Baby & Toddler Products — Belgium" vira "Baby_Toddler_Products_Belgium.pdf".
 */
export function nomeArquivoDoEstudo(nomeDoEstudo: string): string {
    const base = nomeDoEstudo
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^A-Za-z0-9-]+/g, "_")
        .replace(/^[_-]+|[_-]+$/g, "")
        .slice(0, 120)
        .replace(/[_-]+$/, "")
    return `${base || "study"}.pdf`
}

export async function createStudySignedUrl(
    path: string,
    expiresInSeconds = 120,
    nomeArquivo?: string
): Promise<string> {
    const supabase = createAdminClient()
    // `download` faz o Supabase responder com Content-Disposition: attachment
    // e esse nome; sem ele o navegador usa o último trecho da chave.
    const { data, error } = await supabase.storage
        .from(LIST_STUDIES_BUCKET)
        .createSignedUrl(
            extractStudyPathFromUrl(path),
            expiresInSeconds,
            nomeArquivo ? { download: nomeArquivo } : undefined
        )

    if (error || !data) throw new Error(`Falha ao gerar link do PDF: ${error?.message}`)
    return data.signedUrl
}

/**
 * Baixa o PDF do estudo para leitura no servidor (extração do resumo executivo).
 *
 * Diferente de `createStudySignedUrl`, que existe para entregar o arquivo ao
 * comprador: aqui ninguém baixa nada, o arquivo vira bytes na memória.
 */
export async function downloadListPdf(path: string): Promise<Uint8Array> {
    const supabase = createAdminClient()
    const { data, error } = await supabase.storage
        .from(LIST_STUDIES_BUCKET)
        .download(extractStudyPathFromUrl(path))

    if (error || !data) throw new Error(`Falha ao baixar o PDF do estudo: ${error?.message}`)
    return new Uint8Array(await data.arrayBuffer())
}
