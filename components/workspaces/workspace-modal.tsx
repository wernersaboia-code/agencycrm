// components/workspaces/workspace-modal.tsx

"use client"

import { useState, useEffect } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createWorkspace, updateWorkspace } from "@/actions/workspaces"
import { useWorkspace } from "@/contexts/workspace-context"

const COLORS = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
]

const workspaceSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(100),
    description: z.string().max(500).optional().nullable(),
    color: z.string().default("#3B82F6"),
    senderName: z.string().max(100).optional().nullable(),
    senderEmail: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
})

type WorkspaceFormValues = {
    name: string
    description?: string | null
    color: string
    senderName?: string | null
    senderEmail?: string | null
}

type Workspace = {
    id: string
    name: string
    description: string | null
    color: string
    logo: string | null
    senderName: string | null
    senderEmail: string | null
}

interface WorkspaceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspace?: Workspace | null
    onSuccess?: () => void
}

export function WorkspaceModal({
                                   open,
                                   onOpenChange,
                                   workspace,
                                   onSuccess,
                               }: WorkspaceModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { refreshWorkspaces } = useWorkspace()
    const isEditing = !!workspace

    const form = useForm<WorkspaceFormValues>({
        resolver: zodResolver(workspaceSchema) as any,
        defaultValues: {
            name: "",
            description: "",
            color: "#3B82F6",
            senderName: "",
            senderEmail: "",
        },
    })

    // Preencher form ao editar
    useEffect(() => {
        if (workspace) {
            form.reset({
                name: workspace.name,
                description: workspace.description || "",
                color: workspace.color,
                senderName: workspace.senderName || "",
                senderEmail: workspace.senderEmail || "",
            })
        } else {
            form.reset({
                name: "",
                description: "",
                color: "#3B82F6",
                senderName: "",
                senderEmail: "",
            })
        }
    }, [workspace, form])

    const onSubmit: SubmitHandler<WorkspaceFormValues> = async (values) => {
        setIsLoading(true)

        try {
            const data = {
                name: values.name,
                description: values.description || null,
                color: values.color,
                senderName: values.senderName || null,
                senderEmail: values.senderEmail || null,
            }

            const result = isEditing
                ? await updateWorkspace(workspace.id, data)
                : await createWorkspace(data)

            if (result.success) {
                toast.success(isEditing ? "Cliente atualizado!" : "Cliente criado!")
                await refreshWorkspaces()
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(result.error || "Erro ao salvar")
            }
        } catch (error) {
            toast.error("Erro ao salvar cliente")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Cliente" : "Novo Cliente"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Atualize as informações do cliente."
                            : "Adicione um novo cliente para gerenciar suas campanhas."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Nome */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Cliente *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Empresa ABC" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Descrição */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Breve descrição do cliente..."
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Cor */}
                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cor de Identificação</FormLabel>
                                    <FormControl>
                                        <div className="flex gap-2">
                                            {COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    className={`h-8 w-8 rounded-full transition-all ${
                                                        field.value === color
                                                            ? "ring-2 ring-offset-2 ring-primary"
                                                            : "hover:scale-110"
                                                    }`}
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => field.onChange(color)}
                                                />
                                            ))}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Configurações de Email */}
                        <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium mb-3">
                                Configurações de Email (opcional)
                            </h4>

                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="senderName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome do Remetente</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ex: João da Empresa ABC"
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Nome que aparece nos emails enviados
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="senderEmail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email do Remetente</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="Ex: contato@empresa.com"
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Email que aparece como remetente
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Salvar" : "Criar Cliente"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}