// components/calls/CallModal.tsx

"use client"

// ============================================
// IMPORTS
// ============================================
import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import {
    Phone,
    User,
    Building2,
    Clock,
    Calendar,
    MessageSquare,
    Loader2,
    Check,
    Megaphone,
} from "lucide-react"

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { createCall, updateCall } from "@/actions/calls"
import { getLeads } from "@/actions/leads"
import { getCampaigns } from "@/actions/campaigns"
import {
    callFormSchema,
    CallFormValues,
} from "@/lib/validations/call.validations"
import {
    CALL_RESULT_CONFIG,
    parseDurationToSeconds,
    formatCallDuration,
} from "@/lib/constants/call.constants"
import { SerializedCallWithLead } from "@/types/call.types"
import { CallResult } from "@prisma/client"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface CallModalProps {
    isOpen: boolean
    onClose: () => void
    onSaved: () => void
    call: SerializedCallWithLead | null
    workspaceId: string
    preselectedLeadId: string | null
    preselectedCampaignId?: string | null
}

interface LeadOption {
    id: string
    firstName: string
    lastName: string | null
    email: string
    phone: string | null
    company: string | null
}

interface CampaignOption {
    id: string
    name: string
}

// ============================================
// COMPONENT
// ============================================

export function CallModal({
                              isOpen,
                              onClose,
                              onSaved,
                              call,
                              workspaceId,
                              preselectedLeadId,
                              preselectedCampaignId,
                          }: CallModalProps) {
    // ============================================
    // STATE
    // ============================================

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [leads, setLeads] = useState<LeadOption[]>([])
    const [campaigns, setCampaigns] = useState<CampaignOption[]>([])
    const [isLoadingLeads, setIsLoadingLeads] = useState<boolean>(false)
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState<boolean>(false)
    const [selectedLead, setSelectedLead] = useState<LeadOption | null>(null)
    const [isLeadPopoverOpen, setIsLeadPopoverOpen] = useState<boolean>(false)

    const isEditing = !!call

    // ============================================
    // FORM
    // ============================================

    const form = useForm<CallFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(callFormSchema) as any,
        defaultValues: {
            result: "ANSWERED",
            duration: "",
            notes: "",
            followUpAt: "",
            calledAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            campaignId: "",
        },
    })

    // ============================================
    // EFFECTS
    // ============================================

    // Carrega leads e campanhas ao abrir o modal
    useEffect(() => {
        if (!isOpen || !workspaceId) return

        const loadData = async (): Promise<void> => {
            // Carregar leads
            setIsLoadingLeads(true)
            try {
                const result = await getLeads({ workspaceId })
                if (result.success && result.data) {
                    const mappedLeads: LeadOption[] = result.data.leads.map((lead) => ({
                        id: lead.id,
                        firstName: lead.firstName,
                        lastName: lead.lastName,
                        email: lead.email,
                        phone: lead.phone,
                        company: lead.company,
                    }))
                    setLeads(mappedLeads)
                }
            } catch (error) {
                console.error("[CallModal] Error fetching leads:", error)
            } finally {
                setIsLoadingLeads(false)
            }

            // Carregar campanhas
            setIsLoadingCampaigns(true)
            try {
                const campaignsResult = await getCampaigns(workspaceId)
                if (campaignsResult.success && campaignsResult.data) {
                    const mappedCampaigns: CampaignOption[] = campaignsResult.data.map((campaign) => ({
                        id: campaign.id,
                        name: campaign.name,
                    }))
                    setCampaigns(mappedCampaigns)
                }
            } catch (error) {
                console.error("[CallModal] Error fetching campaigns:", error)
            } finally {
                setIsLoadingCampaigns(false)
            }
        }

        loadData()
    }, [isOpen, workspaceId])

    // Preenche formulário ao editar
    useEffect(() => {
        if (call) {
            form.reset({
                result: call.result,
                duration: call.duration ? formatCallDuration(call.duration) : "",
                notes: call.notes || "",
                followUpAt: call.followUpAt
                    ? format(new Date(call.followUpAt), "yyyy-MM-dd'T'HH:mm")
                    : "",
                calledAt: format(new Date(call.calledAt), "yyyy-MM-dd'T'HH:mm"),
                campaignId: call.campaignId || "",
            })
            setSelectedLead(call.lead)
        } else {
            form.reset({
                result: "ANSWERED",
                duration: "",
                notes: "",
                followUpAt: "",
                calledAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                campaignId: preselectedCampaignId || "",
            })
            setSelectedLead(null)
        }
    }, [call, form, preselectedCampaignId])

    // Define lead pré-selecionado
    useEffect(() => {
        if (preselectedLeadId && leads.length > 0 && !isEditing) {
            const preselected = leads.find((lead) => lead.id === preselectedLeadId)
            if (preselected) {
                setSelectedLead(preselected)
            }
        }
    }, [preselectedLeadId, leads, isEditing])

    // ============================================
    // HANDLERS
    // ============================================

    const handleSelectLead = useCallback((lead: LeadOption): void => {
        setSelectedLead(lead)
        setIsLeadPopoverOpen(false)
    }, [])

    const handleSubmit = async (values: CallFormValues): Promise<void> => {
        if (!selectedLead) {
            form.setError("root", { message: "Selecione um lead" })
            return
        }

        setIsSubmitting(true)

        try {
            const durationSeconds = parseDurationToSeconds(values.duration)
            const campaignIdToSave = values.campaignId === "none" || !values.campaignId ? null : values.campaignId

            if (isEditing && call) {
                const result = await updateCall(call.id, {
                    result: values.result as CallResult,
                    duration: durationSeconds,
                    notes: values.notes || null,
                    followUpAt: values.followUpAt ? new Date(values.followUpAt) : null,
                    calledAt: new Date(values.calledAt),
                    campaignId: campaignIdToSave,
                })

                if (!result.success) {
                    form.setError("root", { message: result.error })
                    return
                }
            } else {
                const result = await createCall({
                    leadId: selectedLead.id,
                    workspaceId,
                    result: values.result as CallResult,
                    duration: durationSeconds,
                    notes: values.notes || null,
                    followUpAt: values.followUpAt ? new Date(values.followUpAt) : null,
                    calledAt: new Date(values.calledAt),
                    campaignId: campaignIdToSave,
                })

                if (!result.success) {
                    form.setError("root", { message: result.error })
                    return
                }
            }

            onSaved()
        } catch (error) {
            console.error("[CallModal] Submit error:", error)
            form.setError("root", { message: "Erro ao salvar ligação" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = useCallback((): void => {
        form.reset()
        setSelectedLead(null)
        onClose()
    }, [form, onClose])

    // ============================================
    // COMPUTED
    // ============================================

    const selectedResultConfig = CALL_RESULT_CONFIG[form.watch("result") as CallResult]
    const showFollowUpField = selectedResultConfig?.requiresFollowUp

    // ============================================
    // RENDER
    // ============================================

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        {isEditing ? "Editar Ligação" : "Registrar Ligação"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Atualize os dados da ligação"
                            : "Registre uma nova ligação realizada"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">
                        {/* Área com scroll */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-2">
                            {/* Seleção de Lead */}
                            <div className="space-y-2">
                                <FormLabel>
                                    Lead <span className="text-destructive">*</span>
                                </FormLabel>
                                <Popover
                                    open={isLeadPopoverOpen}
                                    onOpenChange={setIsLeadPopoverOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={isLeadPopoverOpen}
                                            className="w-full justify-start font-normal"
                                            disabled={isEditing}
                                        >
                                            {selectedLead ? (
                                                <div className="flex items-center gap-2 truncate">
                                                    <User className="h-4 w-4 shrink-0" />
                                                    <span className="truncate">
                            {selectedLead.firstName} {selectedLead.lastName}
                          </span>
                                                    {selectedLead.company && (
                                                        <span className="text-muted-foreground truncate">
                              • {selectedLead.company}
                            </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">
                          Selecionar lead...
                        </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0" align="start">
                                        <Command>
                                            <CommandInput
                                                placeholder="Buscar por nome, email ou empresa..."
                                                className="h-9"
                                            />
                                            <CommandList>
                                                <CommandEmpty>
                                                    {isLoadingLeads
                                                        ? "Carregando..."
                                                        : "Nenhum lead encontrado"}
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {leads.map((lead: LeadOption) => (
                                                        <CommandItem
                                                            key={lead.id}
                                                            value={`${lead.firstName} ${lead.lastName} ${lead.email} ${lead.company}`}
                                                            onSelect={() => handleSelectLead(lead)}
                                                        >
                                                            <div className="flex items-center gap-2 w-full">
                                                                <Check
                                                                    className={cn(
                                                                        "h-4 w-4 shrink-0",
                                                                        selectedLead?.id === lead.id
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium truncate">
                                                                        {lead.firstName} {lead.lastName}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                        <span className="truncate">{lead.email}</span>
                                                                        {lead.company && (
                                                                            <>
                                                                                <span>•</span>
                                                                                <span className="truncate flex items-center gap-1">
                                          <Building2 className="h-3 w-3" />
                                                                                    {lead.company}
                                        </span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {!selectedLead && form.formState.errors.root && (
                                    <p className="text-sm text-destructive">Selecione um lead</p>
                                )}
                            </div>

                            {/* Seleção de Campanha (opcional) */}
                            <FormField
                                control={form.control}
                                name="campaignId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Campanha (opcional)</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || "none"}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione uma campanha...">
                                                        {field.value && field.value !== "none" ? (
                                                            <div className="flex items-center gap-2">
                                                                <Megaphone className="h-4 w-4" />
                                                                {campaigns.find((c) => c.id === field.value)?.name}
                                                            </div>
                                                        ) : (
                                                            "Nenhuma campanha"
                                                        )}
                                                    </SelectValue>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    <span className="text-muted-foreground">Nenhuma campanha</span>
                                                </SelectItem>
                                                {isLoadingCampaigns ? (
                                                    <SelectItem value="loading" disabled>
                                                        Carregando...
                                                    </SelectItem>
                                                ) : (
                                                    campaigns.map((campaign) => (
                                                        <SelectItem key={campaign.id} value={campaign.id}>
                                                            <div className="flex items-center gap-2">
                                                                <Megaphone className="h-4 w-4" />
                                                                {campaign.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Vincule esta ligação a uma campanha de prospecção
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Resultado da Ligação */}
                            <FormField
                                control={form.control}
                                name="result"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Resultado <span className="text-destructive">*</span>
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o resultado" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.entries(CALL_RESULT_CONFIG).map(
                                                    ([value, config]) => {
                                                        const Icon = config.icon
                                                        return (
                                                            <SelectItem key={value} value={value}>
                                                                <div className="flex items-center gap-2">
                                                                    <Icon className={cn("h-4 w-4", config.color)} />
                                                                    <span>{config.label}</span>
                                                                </div>
                                                            </SelectItem>
                                                        )
                                                    }
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {selectedResultConfig?.description}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Data/Hora da Ligação */}
                            <FormField
                                control={form.control}
                                name="calledAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Data/Hora <span className="text-destructive">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    type="datetime-local"
                                                    className="pl-10"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Duração */}
                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duração</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    placeholder="Ex: 5 (min) ou 5:30 (min:seg)"
                                                    className="pl-10"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            Formato: minutos ou minutos:segundos
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Follow-up (condicional) */}
                            {showFollowUpField && (
                                <FormField
                                    control={form.control}
                                    name="followUpAt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Agendar Retorno</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        type="datetime-local"
                                                        className="pl-10"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Data e hora para retornar a ligação
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Notas */}
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notas</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Anotações sobre a ligação..."
                                                className="min-h-[80px] resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {field.value?.length || 0}/2000 caracteres
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Erro geral */}
                            {form.formState.errors.root && (
                                <p className="text-sm text-destructive text-center">
                                    {form.formState.errors.root.message}
                                </p>
                            )}
                        </div>

                        {/* Botões - sempre visíveis */}
                        <DialogFooter className="pt-4 border-t mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting || !selectedLead}>
                                {isSubmitting && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                {isEditing ? "Salvar Alterações" : "Registrar Ligação"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}