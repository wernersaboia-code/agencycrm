// components/settings/workspace-settings.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { LogoUpload } from "@/components/ui/logo-upload"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { updateWorkspaceSettings } from "@/actions/workspace-settings"

// ============================================================
// CONSTANTES
// ============================================================

const WORKSPACE_COLORS = [
    { name: "Azul", value: "#3B82F6" },
    { name: "Verde", value: "#22C55E" },
    { name: "Amarelo", value: "#EAB308" },
    { name: "Laranja", value: "#F97316" },
    { name: "Vermelho", value: "#EF4444" },
    { name: "Roxo", value: "#8B5CF6" },
    { name: "Rosa", value: "#EC4899" },
    { name: "Cinza", value: "#6B7280" },
]

// ============================================================
// SCHEMA
// ============================================================

const workspaceSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    description: z.string().optional(),
    color: z.string(),
})

type WorkspaceFormData = z.infer<typeof workspaceSchema>

// ============================================================
// TIPOS
// ============================================================

interface WorkspaceSettingsProps {
    workspace: {
        id: string
        name: string
        description: string | null
        color: string
        logo: string | null
    }
}

// ============================================================
// COMPONENTE
// ============================================================

export function WorkspaceSettings({ workspace }: WorkspaceSettingsProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [currentLogo, setCurrentLogo] = useState(workspace.logo)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isDirty },
    } = useForm<WorkspaceFormData>({
        resolver: zodResolver(workspaceSchema) as any,
        defaultValues: {
            name: workspace.name,
            description: workspace.description || "",
            color: workspace.color,
        },
    })

    const selectedColor = watch("color")
    const watchedName = watch("name")

    // ============================================================
    // HANDLERS
    // ============================================================

    const handleColorSelect = (color: string) => {
        setValue("color", color, { shouldDirty: true })
    }

    const handleLogoChange = (url: string | null) => {
        setCurrentLogo(url)
    }

    const onSubmit = async (data: WorkspaceFormData) => {
        setIsSaving(true)

        try {
            const result = await updateWorkspaceSettings(workspace.id, {
                name: data.name,
                description: data.description || null,
                color: data.color,
                logo: currentLogo,
            })

            if (!result.success) {
                toast.error(result.error || "Erro ao salvar configurações")
                return
            }

            toast.success("Configurações salvas com sucesso!")
        } catch (error) {
            console.error("Save error:", error)
            toast.error("Erro ao salvar configurações.")
        } finally {
            setIsSaving(false)
        }
    }

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <Card>
            <CardHeader>
                <CardTitle>Workspace</CardTitle>
                <CardDescription>
                    Personalize as informações do workspace atual
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Upload de Logo */}
                    <LogoUpload
                        workspaceId={workspace.id}
                        currentLogo={currentLogo}
                        workspaceName={watchedName || workspace.name}
                        workspaceColor={selectedColor}
                        onLogoChange={handleLogoChange}
                    />

                    <div className="border-t pt-6" />

                    {/* Nome */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Workspace</Label>
                        <Input
                            id="name"
                            {...register("name")}
                            placeholder="Ex: Cliente ABC"
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Descrição */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição (opcional)</Label>
                        <Textarea
                            id="description"
                            {...register("description")}
                            placeholder="Breve descrição do cliente ou projeto..."
                            rows={3}
                        />
                    </div>

                    {/* Cor */}
                    <div className="space-y-3">
                        <Label>Cor do Workspace</Label>
                        <div className="flex flex-wrap gap-3">
                            {WORKSPACE_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => handleColorSelect(color.value)}
                                    className={`h-10 w-10 rounded-full border-2 transition-all hover:scale-110 ${
                                        selectedColor === color.value
                                            ? "border-foreground ring-2 ring-foreground ring-offset-2"
                                            : "border-transparent"
                                    }`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Botão Salvar */}
                    <div className="flex justify-end border-t pt-6">
                        <Button type="submit" disabled={isSaving || !isDirty}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                "Salvar Alterações"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}