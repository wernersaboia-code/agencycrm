// components/deals/deal-modal.tsx

"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

import { createDeal, updateDeal } from "@/actions/deals"
import { getCompaniesForSelect } from "@/actions/companies"
import { getContactsForSelect } from "@/actions/contacts"

// Schema de validação
const dealSchema = z.object({
    title: z.string().min(1, "Título é obrigatório").max(100, "Título muito longo"),
    value: z.string().optional(),
    probability: z.string().optional(),
    expectedCloseDate: z.date().optional().nullable(),
    description: z.string().max(1000, "Descrição muito longa").optional(),
    stageId: z.string().optional(),
    contactId: z.string().optional(),
    companyId: z.string().optional(),
})

type DealFormValues = z.infer<typeof dealSchema>

type Stage = {
    id: string
    name: string
    color: string
}

type Deal = {
    id: string
    title: string
    value?: unknown
    probability?: number | null
    expectedCloseDate?: Date | string | null
    description?: string | null
    stageId?: string | null
    contactId?: string | null
    companyId?: string | null
}

type DealModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    deal?: Deal | null
    stages: Stage[]
    onSuccess?: () => void
}

export function DealModal({
                              open,
                              onOpenChange,
                              deal,
                              stages,
                              onSuccess,
                          }: DealModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
    const [contacts, setContacts] = useState<{ id: string; firstName: string; lastName: string }[]>([])
    const isEditing = !!deal

    const form = useForm<DealFormValues>({
        resolver: zodResolver(dealSchema),
        defaultValues: {
            title: "",
            value: "",
            probability: "50",
            expectedCloseDate: null,
            description: "",
            stageId: "",
            contactId: "",
            companyId: "",
        },
    })

    // Helper para converter valor para number
    const toNumber = (value: unknown): number => {
        if (value === null || value === undefined) return 0
        const num = Number(value)
        return isNaN(num) ? 0 : num
    }

    // Formatar valor para exibição (1000 -> "1.000")
    const formatValueForDisplay = (value: number): string => {
        if (!value || value === 0) return ""
        return value.toString()
    }

    // Parser: converte string para número (aceita vírgula ou ponto)
    const parseValue = (value: string): number => {
        if (!value) return 0
        // Remove pontos de milhar e troca vírgula por ponto
        const cleaned = value.replace(/\./g, "").replace(",", ".")
        const num = parseFloat(cleaned)
        return isNaN(num) ? 0 : num
    }

    // Carregar empresas e contatos
    useEffect(() => {
        async function loadData() {
            const [companiesResult, contactsResult] = await Promise.all([
                getCompaniesForSelect(),
                getContactsForSelect(),
            ])

            if (companiesResult.success) {
                setCompanies(companiesResult.data || [])
            }
            if (contactsResult.success) {
                setContacts(contactsResult.data || [])
            }
        }

        if (open) {
            loadData()
        }
    }, [open])

    // Preenche o formulário quando editar
    useEffect(() => {
        if (deal) {
            form.reset({
                title: deal.title,
                value: formatValueForDisplay(toNumber(deal.value)),
                probability: String(deal.probability ?? 50),
                expectedCloseDate: deal.expectedCloseDate
                    ? new Date(deal.expectedCloseDate)
                    : null,
                description: deal.description || "",
                stageId: deal.stageId || "",
                contactId: deal.contactId || "",
                companyId: deal.companyId || "",
            })
        } else {
            form.reset({
                title: "",
                value: "",
                probability: "50",
                expectedCloseDate: null,
                description: "",
                stageId: stages[0]?.id || "",
                contactId: "",
                companyId: "",
            })
        }
    }, [deal, form, stages])

    async function onSubmit(values: DealFormValues) {
        setIsLoading(true)

        try {
            const formData = {
                title: values.title,
                value: values.value ? parseValue(values.value) : null,
                probability: values.probability ? parseInt(values.probability) : 50,
                expectedCloseDate: values.expectedCloseDate || null,
                description: values.description || null,
                stageId: values.stageId?.trim() || null,
                contactId: values.contactId?.trim() || null,
                companyId: values.companyId?.trim() || null,
            }

            const result = isEditing
                ? await updateDeal(deal!.id, formData)
                : await createDeal(formData)

            if (result.success) {
                toast.success(
                    isEditing
                        ? "Deal atualizado com sucesso!"
                        : "Deal criado com sucesso!"
                )
                form.reset()
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(result.error || "Erro ao salvar deal")
            }
        } catch (error) {
            toast.error("Erro inesperado ao salvar deal")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Deal" : "Novo Deal"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Atualize as informações do deal"
                            : "Preencha os dados para criar um novo deal"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Título */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Proposta de consultoria" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Valor e Probabilidade */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor (R$)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="10000"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            Ex: 10000 para R$ 10.000,00
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="probability"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Probabilidade (%)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="50"
                                                min="0"
                                                max="100"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Estágio e Data prevista */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="stageId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estágio</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {stages.map((stage) => (
                                                    <SelectItem key={stage.id} value={stage.id}>
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: stage.color }}
                                                            />
                                                            {stage.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="expectedCloseDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data prevista</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                                        ) : (
                                                            <span>Selecione</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value || undefined}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Empresa e Contato */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="companyId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Empresa</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value=" ">Nenhuma</SelectItem>
                                                {companies.map((company) => (
                                                    <SelectItem key={company.id} value={company.id}>
                                                        {company.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="contactId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contato</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value=" ">Nenhum</SelectItem>
                                                {contacts.map((contact) => (
                                                    <SelectItem key={contact.id} value={contact.id}>
                                                        {contact.firstName} {contact.lastName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Descrição */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalhes sobre o deal..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Botões */}
                        <div className="flex justify-end gap-3 pt-4">
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
                                {isEditing ? "Salvar" : "Criar"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}