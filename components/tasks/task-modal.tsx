// components/tasks/task-modal.tsx

"use client"

import { useState, useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"

import {
    Dialog,
    DialogContent,
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import {
    createTask,
    updateTask,
    getContactsForSelect,
    getCompaniesForSelect,
    getDealsForSelect,
    type TaskWithRelations,
} from "@/actions/tasks"

// Schema de validação
const taskSchema = z.object({
    title: z.string().min(1, "Título é obrigatório"),
    description: z.string().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    dueDate: z.date().optional().nullable(),
    contactId: z.string().optional(),
    companyId: z.string().optional(),
    dealId: z.string().optional(),
})

type TaskFormValues = z.infer<typeof taskSchema>

type SelectOption = {
    id: string
    name?: string
    firstName?: string
    lastName?: string
    title?: string
}

type TaskModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    task?: TaskWithRelations | null
    onSuccess?: (task: TaskWithRelations) => void
    defaultContactId?: string
    defaultCompanyId?: string
    defaultDealId?: string
}

const statusOptions = [
    { value: "TODO", label: "A Fazer" },
    { value: "IN_PROGRESS", label: "Em Progresso" },
    { value: "COMPLETED", label: "Concluída" },
    { value: "CANCELLED", label: "Cancelada" },
]

const priorityOptions = [
    { value: "LOW", label: "Baixa", color: "text-gray-500" },
    { value: "MEDIUM", label: "Média", color: "text-blue-500" },
    { value: "HIGH", label: "Alta", color: "text-orange-500" },
    { value: "URGENT", label: "Urgente", color: "text-red-500" },
]

export function TaskModal({
                              open,
                              onOpenChange,
                              task,
                              onSuccess,
                              defaultContactId,
                              defaultCompanyId,
                              defaultDealId,
                          }: TaskModalProps) {
    const [isPending, startTransition] = useTransition()
    const [contacts, setContacts] = useState<SelectOption[]>([])
    const [companies, setCompanies] = useState<SelectOption[]>([])
    const [deals, setDeals] = useState<SelectOption[]>([])
    const [loadingOptions, setLoadingOptions] = useState(true)

    const isEditing = !!task

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: "",
            description: "",
            status: "TODO",
            priority: "MEDIUM",
            dueDate: null,
            contactId: "",
            companyId: "",
            dealId: "",
        },
    })

    // Carregar opções dos selects
    useEffect(() => {
        async function loadOptions() {
            setLoadingOptions(true)
            try {
                const [contactsRes, companiesRes, dealsRes] = await Promise.all([
                    getContactsForSelect(),
                    getCompaniesForSelect(),
                    getDealsForSelect(),
                ])

                if (contactsRes.success) setContacts(contactsRes.data || [])
                if (companiesRes.success) setCompanies(companiesRes.data || [])
                if (dealsRes.success) setDeals(dealsRes.data || [])
            } catch (error) {
                console.error("Erro ao carregar opções:", error)
            } finally {
                setLoadingOptions(false)
            }
        }

        if (open) {
            loadOptions()
        }
    }, [open])

    // Preencher formulário ao editar
    useEffect(() => {
        if (open) {
            if (task) {
                form.reset({
                    title: task.title,
                    description: task.description || "",
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.dueDate ? new Date(task.dueDate) : null,
                    contactId: task.contact?.id || "",
                    companyId: task.company?.id || "",
                    dealId: task.deal?.id || "",
                })
            } else {
                form.reset({
                    title: "",
                    description: "",
                    status: "TODO",
                    priority: "MEDIUM",
                    dueDate: null,
                    contactId: defaultContactId || "",
                    companyId: defaultCompanyId || "",
                    dealId: defaultDealId || "",
                })
            }
        }
    }, [open, task, form, defaultContactId, defaultCompanyId, defaultDealId])

    function onSubmit(values: TaskFormValues) {
        startTransition(async () => {
            try {
                const data = {
                    title: values.title,
                    description: values.description || null,
                    status: values.status,
                    priority: values.priority,
                    dueDate: values.dueDate?.toISOString() || null,
                    contactId: values.contactId || null,
                    companyId: values.companyId || null,
                    dealId: values.dealId || null,
                }

                const result = isEditing
                    ? await updateTask(task.id, data)
                    : await createTask(data)

                if (result.success) {
                    toast.success(isEditing ? "Tarefa atualizada!" : "Tarefa criada!")
                    onOpenChange(false)
                    if (onSuccess && result.data) {
                        onSuccess(result.data)
                    }
                } else {
                    toast.error(result.error || "Erro ao salvar tarefa")
                }
            } catch (error) {
                toast.error("Erro ao salvar tarefa")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Tarefa" : "Nova Tarefa"}
                    </DialogTitle>
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
                                        <Input placeholder="Ex: Ligar para o cliente" {...field} />
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
                                            placeholder="Detalhes da tarefa..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Status e Prioridade */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {statusOptions.map((option) => (
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

                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prioridade</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {priorityOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        <span className={option.color}>{option.label}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Data de Vencimento */}
                        <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Data de Vencimento</FormLabel>
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
                                                        format(field.value, "PPP", { locale: ptBR })
                                                    ) : (
                                                        <span>Selecione uma data</span>
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
                                                locale={ptBR}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Vínculos */}
                        <div className="space-y-4 pt-2 border-t">
                            <p className="text-sm font-medium text-muted-foreground">
                                Vincular a (opcional)
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Contato */}
                                <FormField
                                    control={form.control}
                                    name="contactId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contato</FormLabel>
                                            <Select
                                                onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                                                value={field.value || "none"}
                                                disabled={loadingOptions}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Nenhum" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Nenhum</SelectItem>
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

                                {/* Empresa */}
                                <FormField
                                    control={form.control}
                                    name="companyId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Empresa</FormLabel>
                                            <Select
                                                onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                                                value={field.value || "none"}
                                                disabled={loadingOptions}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Nenhuma" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Nenhuma</SelectItem>
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

                                {/* Deal */}
                                <FormField
                                    control={form.control}
                                    name="dealId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Deal</FormLabel>
                                            <Select
                                                onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                                                value={field.value || "none"}
                                                disabled={loadingOptions}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Nenhum" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Nenhum</SelectItem>
                                                    {deals.map((deal) => (
                                                        <SelectItem key={deal.id} value={deal.id}>
                                                            {deal.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Botões */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Salvar" : "Criar Tarefa"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}