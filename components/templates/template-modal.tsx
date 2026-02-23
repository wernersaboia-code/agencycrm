// components/templates/template-modal.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Eye, Info, Loader2, Sparkles } from "lucide-react"
import { TemplateCategory } from "@prisma/client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"

import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
    createTemplate,
    updateTemplate,
    type TemplateWithStats,
} from "@/actions/templates"
import {
    templateFormSchema,
    type TemplateFormData,
    DEFAULT_TEMPLATE_VALUES,
} from "@/lib/validations/template.validations"
import {
    TEMPLATE_CATEGORY_CONFIG,
    TEMPLATE_VARIABLES,
    PREVIEW_LEAD,
    replaceVariables,
} from "@/lib/constants/template.constants"

// ============================================================
// TIPOS
// ============================================================

interface TemplateModalProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    template: TemplateWithStats | null
    workspaceId: string
}

// ============================================================
// COMPONENTE
// ============================================================

export function TemplateModal({
                                  open,
                                  onClose,
                                  onSuccess,
                                  template,
                                  workspaceId,
                              }: TemplateModalProps) {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")

    const isEditing = !!template

    // Form
    const form = useForm<TemplateFormData>({
        resolver: zodResolver(templateFormSchema) as any,
        defaultValues: DEFAULT_TEMPLATE_VALUES,
    })

    const { watch, setValue } = form
    const watchSubject = watch("subject")
    const watchBody = watch("body")

    // Reset form quando modal abre/fecha
    useEffect(() => {
        if (open) {
            if (template) {
                form.reset({
                    name: template.name,
                    category: template.category,
                    subject: template.subject,
                    body: template.body,
                    isActive: template.isActive,
                })
            } else {
                form.reset(DEFAULT_TEMPLATE_VALUES)
            }
            setActiveTab("edit")
        }
    }, [open, template, form])

    // ============================================================
    // HANDLERS
    // ============================================================

    const insertVariableInSubject = useCallback(
        (variable: string) => {
            const currentValue = watchSubject || ""
            setValue("subject", currentValue + `{{${variable}}}`, { shouldDirty: true })
        },
        [watchSubject, setValue]
    )

    // ============================================================
    // SUBMIT
    // ============================================================

    const onSubmit = async (data: TemplateFormData): Promise<void> => {
        setIsSubmitting(true)

        try {
            if (isEditing) {
                const result = await updateTemplate(template.id, data)
                if (result.success) {
                    toast.success("Template atualizado!")
                    onSuccess()
                } else {
                    toast.error(result.error || "Erro ao atualizar")
                }
            } else {
                const result = await createTemplate({
                    ...data,
                    workspaceId,
                })
                if (result.success) {
                    toast.success("Template criado!")
                    onSuccess()
                } else {
                    toast.error(result.error || "Erro ao criar")
                }
            }
        } catch (error) {
            toast.error("Erro inesperado")
        } finally {
            setIsSubmitting(false)
        }
    }

    // ============================================================
    // PREVIEW
    // ============================================================

    const previewSubject = replaceVariables(watchSubject || "", PREVIEW_LEAD)
    const previewBody = replaceVariables(watchBody || "", PREVIEW_LEAD)

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Template" : "Novo Template"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Atualize as informações do template de email."
                            : "Crie um novo template para usar em suas campanhas."}
                    </DialogDescription>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as "edit" | "preview")}
                    className="flex-1 flex flex-col min-h-0"
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="edit">Editar</TabsTrigger>
                        <TabsTrigger value="preview">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                        </TabsTrigger>
                    </TabsList>

                    {/* ====== TAB EDITAR ====== */}
                    <TabsContent value="edit" className="flex-1 overflow-hidden mt-4">
                        <ScrollArea className="h-[calc(90vh-280px)]">
                            <Form {...form}>
                                <form className="space-y-6 pr-4">
                                    {/* Nome e Categoria */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nome do Template *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Ex: Primeiro Contato"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Categoria *</FormLabel>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecione" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {Object.entries(TEMPLATE_CATEGORY_CONFIG).map(
                                                                ([key, config]) => (
                                                                    <SelectItem key={key} value={key}>
                                                                        <div className="flex items-center gap-2">
                                                                            <config.icon className="h-4 w-4" />
                                                                            {config.label}
                                                                        </div>
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Assunto */}
                                    <FormField
                                        control={form.control}
                                        name="subject"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center justify-between">
                                                    <FormLabel>Assunto do Email *</FormLabel>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 text-xs"
                                                                >
                                                                    <Sparkles className="h-3 w-3 mr-1" />
                                                                    Inserir variável
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent
                                                                side="bottom"
                                                                className="w-64 p-2"
                                                            >
                                                                <div className="space-y-1">
                                                                    <p className="font-medium text-xs mb-2">
                                                                        Clique para inserir:
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {TEMPLATE_VARIABLES.slice(0, 6).map((v) => (
                                                                            <Badge
                                                                                key={v.key}
                                                                                variant="secondary"
                                                                                className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                                                                                onClick={() =>
                                                                                    insertVariableInSubject(v.key)
                                                                                }
                                                                            >
                                                                                {`{{${v.key}}}`}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Ex: Olá {{firstName}}, temos uma proposta!"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Corpo do Email - TIPTAP */}
                                    <FormField
                                        control={form.control}
                                        name="body"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Corpo do Email *</FormLabel>
                                                <FormControl>
                                                    <RichTextEditor
                                                        content={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Escreva o conteúdo do seu email..."
                                                    />
                                                </FormControl>
                                                <FormMessage />

                                                {/* Dica */}
                                                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                                                    <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                                    <div className="text-xs text-blue-700 dark:text-blue-300">
                                                        <p className="font-medium mb-1">Dica:</p>
                                                        <p>
                                                            Use o botão <strong>"Variável"</strong> na barra
                                                            de ferramentas para inserir campos dinâmicos como
                                                            nome, empresa, etc. Eles serão substituídos
                                                            automaticamente pelos dados de cada lead.
                                                        </p>
                                                    </div>
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    {/* Ativo */}
                                    <FormField
                                        control={form.control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">
                                                        Template Ativo
                                                    </FormLabel>
                                                    <p className="text-sm text-muted-foreground">
                                                        Templates inativos não aparecem na seleção de
                                                        campanhas
                                                    </p>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </form>
                            </Form>
                        </ScrollArea>
                    </TabsContent>

                    {/* ====== TAB PREVIEW ====== */}
                    <TabsContent value="preview" className="flex-1 overflow-hidden mt-4">
                        <ScrollArea className="h-[calc(90vh-280px)]">
                            <div className="space-y-4 pr-4">
                                {/* Info do preview */}
                                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-md">
                                    <Info className="h-4 w-4 text-amber-500" />
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        Preview usando dados de exemplo. As variáveis serão
                                        substituídas pelos dados reais dos leads.
                                    </p>
                                </div>

                                {/* Simulação de email */}
                                <div className="border rounded-lg overflow-hidden">
                                    {/* Header do email */}
                                    <div className="bg-muted p-4 border-b">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex">
                                                <span className="w-20 text-muted-foreground">De:</span>
                                                <span>Sua Empresa &lt;contato@suaempresa.com&gt;</span>
                                            </div>
                                            <div className="flex">
                        <span className="w-20 text-muted-foreground">
                          Para:
                        </span>
                                                <span>
                          {PREVIEW_LEAD.fullName} &lt;{PREVIEW_LEAD.email}&gt;
                        </span>
                                            </div>
                                            <div className="flex">
                        <span className="w-20 text-muted-foreground font-medium">
                          Assunto:
                        </span>
                                                <span className="font-medium">
                          {previewSubject || "(sem assunto)"}
                        </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Corpo do email */}
                                    <div className="p-6 bg-white dark:bg-gray-950">
                                        {previewBody ? (
                                            <div
                                                className="prose prose-sm dark:prose-invert max-w-none"
                                                dangerouslySetInnerHTML={{ __html: previewBody }}
                                            />
                                        ) : (
                                            <p className="text-muted-foreground italic">
                                                (corpo do email vazio)
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Dados usados no preview */}
                                <div className="p-4 border rounded-lg bg-muted/30">
                                    <h4 className="font-medium text-sm mb-3">
                                        Dados usados no preview:
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                        {Object.entries(PREVIEW_LEAD).map(([key, value]) => (
                                            <div key={key} className="flex gap-1">
                                                <code className="text-muted-foreground">{`{{${key}}}`}</code>
                                                <span>→</span>
                                                <span className="font-medium">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {isEditing ? "Salvar Alterações" : "Criar Template"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}