// components/ui/logo-upload.tsx
"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Trash2, Loader2, Building2 } from "lucide-react"
import { toast } from "sonner"
import { uploadLogo, removeLogo } from "@/lib/supabase/storage"
import { updateWorkspaceLogo } from "@/actions/workspace-settings"

interface LogoUploadProps {
    workspaceId: string
    currentLogo?: string | null
    workspaceName: string
    workspaceColor: string
    onLogoChange?: (url: string | null) => void
}

export function LogoUpload({
                               workspaceId,
                               currentLogo,
                               workspaceName,
                               workspaceColor,
                               onLogoChange,
                           }: LogoUploadProps) {
    const [logo, setLogo] = useState<string | null>(currentLogo || null)
    const [isUploading, setIsUploading] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)

        try {
            // Upload para o Supabase Storage
            const result = await uploadLogo(file, workspaceId)

            if (!result.success) {
                toast.error(result.error)
                return
            }

            // Atualizar no banco
            const updateResult = await updateWorkspaceLogo(workspaceId, result.url!)

            if (!updateResult.success) {
                toast.error(updateResult.error)
                return
            }

            setLogo(result.url!)
            onLogoChange?.(result.url!)
            toast.success("Logo atualizada com sucesso!")
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Erro ao fazer upload da logo.")
        } finally {
            setIsUploading(false)
            // Limpar input para permitir selecionar o mesmo arquivo novamente
            if (inputRef.current) {
                inputRef.current.value = ""
            }
        }
    }

    const handleRemove = async () => {
        setIsRemoving(true)

        try {
            // Remover do Supabase Storage
            const result = await removeLogo(workspaceId)

            if (!result.success) {
                toast.error(result.error)
                return
            }

            // Atualizar no banco
            const updateResult = await updateWorkspaceLogo(workspaceId, null)

            if (!updateResult.success) {
                toast.error(updateResult.error)
                return
            }

            setLogo(null)
            onLogoChange?.(null)
            toast.success("Logo removida com sucesso!")
        } catch (error) {
            console.error("Remove error:", error)
            toast.error("Erro ao remover logo.")
        } finally {
            setIsRemoving(false)
        }
    }

    const initials = workspaceName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return (
        <div className="space-y-4">
            <label className="text-sm font-medium">Logo do Workspace</label>

            <div className="flex items-center gap-6">
                {/* Preview da Logo */}
                <Avatar className="h-24 w-24 rounded-lg border-2 border-muted">
                    <AvatarImage src={logo || undefined} alt={workspaceName} />
                    <AvatarFallback
                        className="rounded-lg text-xl font-semibold text-white"
                        style={{ backgroundColor: workspaceColor }}
                    >
                        {initials || <Building2 className="h-8 w-8" />}
                    </AvatarFallback>
                </Avatar>

                {/* Botões */}
                <div className="flex flex-col gap-2">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="logo-upload"
                    />

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading || isRemoving}
                        onClick={() => inputRef.current?.click()}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Fazer Upload
                            </>
                        )}
                    </Button>

                    {logo && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isUploading || isRemoving}
                            onClick={handleRemove}
                            className="text-destructive hover:text-destructive"
                        >
                            {isRemoving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Removendo...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remover
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                PNG, JPG ou WebP. Máximo 2MB. Tamanho recomendado: 200x200px
            </p>
        </div>
    )
}