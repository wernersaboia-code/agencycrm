// components/leads/lead-modal.tsx

"use client"

import { useState, useEffect } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { LeadStatus } from "@prisma/client"

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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createLead, updateLead } from "@/actions/leads"
import { useWorkspace } from "@/contexts/workspace-context"

const leadSchema = z.object({
    firstName: z.string().min(1, "Nome é obrigatório").max(100),
    lastName: z.string().max(100).optional().nullable(),
    email: z.string().email("Email inválido"),
    phone: z.string().max(20).optional().nullable(),
    mobile: z.string().max(20).optional().nullable(),
    company: z.string().max(100).optional().nullable(),
    jobTitle: z.string().max(100).optional().nullable(),
    website: z.string().max(200).optional().nullable(),
    status: z.nativeEnum(LeadStatus).default("NEW"),
    source: z.string().max(50).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
})

type LeadFormValues = {
    firstName: string
    lastName?: string | null
    email: string
    phone?: string | null
    mobile?: string | null
    company?: string | null
    jobTitle?: string | null
    website?: string | null
    status: LeadStatus
    source?: string | null
    notes?: string | null
}

type Lead = {
    id: string
    firstName: string
    lastName: string | null
    email: string
    phone: string | null
    mobile: string | null
    company: string | null
    jobTitle: string | null
    website: string | null
    status: LeadStatus
    source: string | null
    notes: string | null
}

interface LeadModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    lead?: Lead | null
    onSuccess?: () => void
}

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
    { value: "NEW", label: "Novo" },
    { value: "CONTACTED", label: "Contatado" },
    { value: "OPENED", label: "Abriu Email" },
    { value: "CLICKED", label: "Clicou" },
    { value: "REPLIED", label: "Respondeu" },
    { value: "CALLED", label: "Ligação Realizada" },
    { value: "INTERESTED", label: "Interessado" },
    { value: "NOT_INTERESTED", label: "Sem Interesse" },
    { value: "NEGOTIATING", label: "Em Negociação" },
    { value: "CONVERTED", label: "Convertido" },
    { value: "UNSUBSCRIBED", label: "Descadastrado" },
    { value: "BOUNCED", label: "Email Inválido" },
]

export function LeadModal({
                              open,
                              onOpenChange,
                              lead,
                              onSuccess,
                          }: LeadModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { activeWorkspace } = useWorkspace()
    const isEditing = !!lead

    const form = useForm<LeadFormValues>({
        resolver: zodResolver(leadSchema) as any,
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            mobile: "",
            company: "",
            jobTitle: "",
            website: "",
            status: "NEW",
            source: "",
            notes: "",
        },
    })

    useEffect(() => {
        if (lead) {
            form.reset({
                firstName: lead.firstName,
                lastName: lead.lastName || "",
                email: lead.email,
                phone: lead.phone || "",
                mobile: lead.mobile || "",
                company: lead.company || "",
                jobTitle: lead.jobTitle || "",
                website: lead.website || "",
                status: lead.status,
                source: lead.source || "",
                notes: lead.notes || "",
            })
        } else {
            form.reset({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                mobile: "",
                company: "",
                jobTitle: "",
                website: "",
                status: "NEW",
                source: "",
                notes: "",
            })
        }
    }, [lead, form])

    const onSubmit: SubmitHandler<LeadFormValues> = async (values) => {
        if (!activeWorkspace) {
            toast.error("Selecione um cliente primeiro")
            return
        }

        setIsLoading(true)

        try {
            const data = {
                ...values,
                lastName: values.lastName || null,
                phone: values.phone || null,
                mobile: values.mobile || null,
                company: values.company || null,
                jobTitle: values.jobTitle || null,
                website: values.website || null,
                source: values.source || null,
                notes: values.notes || null,
            }

            const result = isEditing
                ? await updateLead(activeWorkspace.id, lead.id, data)
                : await createLead(activeWorkspace.id, data)

            if (result.success) {
                toast.success(isEditing ? "Lead atualizado!" : "Lead criado!")
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(result.error || "Erro ao salvar")
            }
        } catch (error) {
            toast.error("Erro ao salvar lead")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Lead" : "Novo Lead"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Atualize as informações do lead."
                            : "Adicione um novo lead para prospecção."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Nome */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="João" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sobrenome</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Silva"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Email */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="joao@empresa.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Telefones */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefone</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="(11) 3333-4444"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="mobile"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Celular</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="(11) 99999-8888"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Empresa */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="company"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Empresa</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Empresa XYZ"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="jobTitle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cargo</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Diretor de Marketing"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Website e Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="https://empresa.com"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {STATUS_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Origem */}
                        <FormField
                            control={form.control}
                            name="source"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Origem</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: LinkedIn, Indicação, Site..."
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Notas */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Observações sobre o lead..."
                                            rows={3}
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                {isEditing ? "Salvar" : "Criar Lead"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}