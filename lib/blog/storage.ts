import { createClient } from "@/lib/supabase/client"

const BUCKET = "blog"
const MAX = 4 * 1024 * 1024

export interface BlogUploadResult {
    success: boolean
    url?: string
    error?: string
}

export async function uploadBlogImage(file: File): Promise<BlogUploadResult> {
    const allowed = ["image/png", "image/jpeg", "image/webp"]
    if (!allowed.includes(file.type)) {
        return { success: false, error: "Formato inválido. Use PNG, JPG ou WebP." }
    }
    if (file.size > MAX) {
        return { success: false, error: "Arquivo muito grande. Máximo 4MB." }
    }

    const supabase = createClient()
    const ext = file.name.split(".").pop() || "jpg"
    const fileName = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
    })
    if (error) {
        console.error("Blog image upload error:", error)
        return { success: false, error: "Erro ao fazer upload. Tente novamente." }
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    return { success: true, url: data.publicUrl }
}
