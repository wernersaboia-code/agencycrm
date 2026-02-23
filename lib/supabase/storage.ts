// lib/supabase/storage.ts
import { createClient } from "@/lib/supabase/client"

const BUCKET_NAME = "logos"
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export interface UploadResult {
    success: boolean
    url?: string
    error?: string
}

/**
 * Faz upload de uma imagem para o Supabase Storage
 */
export async function uploadLogo(
    file: File,
    workspaceId: string
): Promise<UploadResult> {
    // Validar tipo
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
        return {
            success: false,
            error: "Formato inválido. Use PNG, JPG ou WebP.",
        }
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
        return {
            success: false,
            error: "Arquivo muito grande. Máximo 2MB.",
        }
    }

    const supabase = createClient()

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split(".").pop()
    const fileName = `${workspaceId}/logo-${Date.now()}.${fileExtension}`

    // Deletar logo anterior (se existir)
    const { data: existingFiles } = await supabase.storage
        .from(BUCKET_NAME)
        .list(workspaceId)

    if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((f) => `${workspaceId}/${f.name}`)
        await supabase.storage.from(BUCKET_NAME).remove(filesToDelete)
    }

    // Fazer upload
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
            cacheControl: "3600",
            upsert: true,
        })

    if (uploadError) {
        console.error("Upload error:", uploadError)
        return {
            success: false,
            error: "Erro ao fazer upload. Tente novamente.",
        }
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName)

    return {
        success: true,
        url: urlData.publicUrl,
    }
}

/**
 * Remove a logo de um workspace
 */
export async function removeLogo(workspaceId: string): Promise<UploadResult> {
    const supabase = createClient()

    // Listar arquivos do workspace
    const { data: existingFiles, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(workspaceId)

    if (listError) {
        console.error("List error:", listError)
        return {
            success: false,
            error: "Erro ao buscar logo.",
        }
    }

    if (!existingFiles || existingFiles.length === 0) {
        return { success: true }
    }

    // Deletar arquivos
    const filesToDelete = existingFiles.map((f) => `${workspaceId}/${f.name}`)
    const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filesToDelete)

    if (deleteError) {
        console.error("Delete error:", deleteError)
        return {
            success: false,
            error: "Erro ao remover logo.",
        }
    }

    return { success: true }
}