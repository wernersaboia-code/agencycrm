// components/leads/lead-modal.tsx

"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Loader2,
    User,
    Building2,
    MapPin,
    Settings,
    Mail,
    Phone,
    Globe,
    Briefcase,
    Hash,
    FileText,
    AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { LeadStatus, LeadSource, CompanySize } from "@prisma/client"

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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { createLead, updateLead } from "@/actions/leads"
import { useWorkspace } from "@/contexts/workspace-context"
import {
    leadFormSchema,
    type LeadFormData,
    DEFAULT_LEAD_VALUES,
} from "@/lib/validations/lead.validations"
import {
    LEAD_STATUS_OPTIONS,
    LEAD_SOURCE_OPTIONS,
    COMPANY_SIZE_OPTIONS,
    COUNTRIES,
    INDUSTRIES,
} from "@/lib/constants/lead.constants"
import { prepareLeadForForm } from "@/lib/utils/lead.utils"

// ============================================================
// TIPOS
// ============================================================

interface Lead {
    id: string
    firstName: string
    lastName: string | null
    email: string
    phone: string | null
    mobile: string | null
    company: string | null
    jobTitle: string | null
    website: string | null
    taxId: string | null
    industry: string | null
    companySize: CompanySize | null
    address: string | null
    city: string | null
    state: string | null
    postalCode: string | null
    country: string | null
    status: LeadStatus
    source: LeadSource
    notes: string | null
}

interface LeadModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    lead?: Lead | null
    onSuccess?: () => void
}

// ============================================================
// MAPEAMENTO DE CAMPOS POR ABA
// ============================================================

const TAB_FIELDS: Record<string, (keyof LeadFormData)[]> = {
    contact: ['firstName', 'lastName', 'email', 'phone', 'mobile'],
    company: ['company', 'jobTitle', 'website', 'taxId', 'industry', 'companySize'],
    location: ['address', 'city', 'state', 'postalCode', 'country'],
    status: ['status', 'source', 'notes'],
}

const TAB_LABELS: Record<string, string> = {
    contact: 'Contato',
    company: 'Empresa',
    location: 'Localização',
    status: 'Status',
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function FormSection({
                         children,
                         className = ""
                     }: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`space-y-4 ${className}`}>
            {children}
        </div>
    )
}

function FormRow({
                     children,
                     cols = 2
                 }: {
    children: React.ReactNode
    cols?: 2 | 3
}) {
    return (
        <div className={`grid gap-4 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {children}
        </div>
    )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function LeadModal({
                              open,
                              onOpenChange,
                              lead,
                              onSuccess,
                          }: LeadModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("contact")
    const { activeWorkspace } = useWorkspace()
    const isEditing = !!lead

    const form = useForm<LeadFormData>({
        resolver: zodResolver(leadFormSchema) as any,
        defaultValues: DEFAULT_LEAD_VALUES,
    })

    // Pega os erros do form
    const formErrors = form.formState.errors

    // Encontra em qual aba está o primeiro erro
    const getTabsWithErrors = (): string[] => {
        const tabsWithErrors: string[] = []

        for (const [tab, fields] of Object.entries(TAB_FIELDS)) {
            const hasError = fields.some(field => formErrors[field])
            if (hasError) {
                tabsWithErrors.push(tab)
            }
        }

        return tabsWithErrors
    }

    const tabsWithErrors = getTabsWithErrors()

    // Obtém lista de erros formatada
    const getErrorMessages = (): string[] => {
        const messages: string[] = []

        for (const [field, error] of Object.entries(formErrors)) {
            if (error?.message) {
                messages.push(error.message as string)
            }
        }

        return messages
    }

    // Reset form quando lead ou modal muda
    useEffect(() => {
        if (open) {
            if (lead) {
                const formData = prepareLeadForForm({
                    ...lead,
                    status: lead.status,
                    source: lead.source,
                    companySize: lead.companySize,
                })
                form.reset(formData as LeadFormData)
            } else {
                form.reset(DEFAULT_LEAD_VALUES)
            }
            setActiveTab("contact")
        }
    }, [lead, open, form])

    const onSubmit = async (values: LeadFormData) => {
        if (!activeWorkspace) {
            toast.error("Selecione um cliente primeiro")
            return
        }

        setIsLoading(true)

        try {
            const result = isEditing
                ? await updateLead(lead.id, values)
                : await createLead({ ...values, workspaceId: activeWorkspace.id })

            if (result.success) {
                toast.success(isEditing ? "Lead atualizado!" : "Lead criado!")
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(result.error || "Erro ao salvar")
            }
        } catch (error) {
            console.error("Erro ao salvar lead:", error)
            toast.error("Erro ao salvar lead")
        } finally {
            setIsLoading(false)
        }
    }

    // Handler para quando o form é inválido
    const onInvalid = () => {
        // Vai para a primeira aba com erro
        if (tabsWithErrors.length > 0) {
            setActiveTab(tabsWithErrors[0])

            // Mostra toast com os erros
            const errors = getErrorMessages()
            if (errors.length > 0) {
                toast.error(
                    <div>
                        <p className="font-medium">Corrija os erros:</p>
                        <ul className="mt-1 text-sm list-disc list-inside">
                            {errors.slice(0, 3).map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                            {errors.length > 3 && <li>...e mais {errors.length - 3} erro(s)</li>}
                        </ul>
                    </div>
                )
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {isEditing ? "Editar Lead" : "Novo Lead"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Atualize as informações do lead."
                            : "Adicione um novo lead para prospecção."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
                        className="flex flex-col flex-1 overflow-hidden"
                    >
                        {/* Alerta de erros */}
                        {tabsWithErrors.length > 0 && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="flex items-center gap-2">
                                    <span>Há erros nos campos. Verifique as abas:</span>
                                    {tabsWithErrors.map(tab => (
                                        <Badge
                                            key={tab}
                                            variant="destructive"
                                            className="cursor-pointer"
                                            onClick={() => setActiveTab(tab)}
                                        >
                                            {TAB_LABELS[tab]}
                                        </Badge>
                                    ))}
                                </AlertDescription>
                            </Alert>
                        )}

                        <Tabs
                            value={activeTab}
                            onValueChange={setActiveTab}
                            className="flex-1 flex flex-col overflow-hidden"
                        >
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger
                                    value="contact"
                                    className={`flex items-center gap-1 ${tabsWithErrors.includes('contact') ? 'text-destructive' : ''}`}
                                >
                                    <User className="h-4 w-4" />
                                    <span className="hidden sm:inline">Contato</span>
                                    {tabsWithErrors.includes('contact') && (
                                        <AlertCircle className="h-3 w-3 text-destructive" />
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="company"
                                    className={`flex items-center gap-1 ${tabsWithErrors.includes('company') ? 'text-destructive' : ''}`}
                                >
                                    <Building2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">Empresa</span>
                                    {tabsWithErrors.includes('company') && (
                                        <AlertCircle className="h-3 w-3 text-destructive" />
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="location"
                                    className={`flex items-center gap-1 ${tabsWithErrors.includes('location') ? 'text-destructive' : ''}`}
                                >
                                    <MapPin className="h-4 w-4" />
                                    <span className="hidden sm:inline">Localização</span>
                                    {tabsWithErrors.includes('location') && (
                                        <AlertCircle className="h-3 w-3 text-destructive" />
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="status"
                                    className={`flex items-center gap-1 ${tabsWithErrors.includes('status') ? 'text-destructive' : ''}`}
                                >
                                    <Settings className="h-4 w-4" />
                                    <span className="hidden sm:inline">Status</span>
                                    {tabsWithErrors.includes('status') && (
                                        <AlertCircle className="h-3 w-3 text-destructive" />
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            <ScrollArea className="flex-1 px-1">
                                {/* === ABA CONTATO === */}
                                <TabsContent value="contact" className="mt-4 space-y-4">
                                    <FormSection>
                                        <FormRow>
                                            <FormField
                                                control={form.control}
                                                name="firstName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Nome *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="João"
                                                                {...field}
                                                                value={field.value || ''}
                                                            />
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
                                                                value={field.value || ''}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </FormRow>

                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        Email *
                                                    </FormLabel>
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

                                        <FormRow>
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            Telefone
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="+55 11 3333-4444"
                                                                {...field}
                                                                value={field.value || ''}
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
                                                        <FormLabel className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            Celular
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="+55 11 99999-8888"
                                                                {...field}
                                                                value={field.value || ''}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </FormRow>
                                    </FormSection>
                                </TabsContent>

                                {/* === ABA EMPRESA === */}
                                <TabsContent value="company" className="mt-4 space-y-4">
                                    <FormSection>
                                        <FormRow>
                                            <FormField
                                                control={form.control}
                                                name="company"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-1">
                                                            <Building2 className="h-3 w-3" />
                                                            Empresa
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Empresa XYZ"
                                                                {...field}
                                                                value={field.value || ''}
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
                                                        <FormLabel className="flex items-center gap-1">
                                                            <Briefcase className="h-3 w-3" />
                                                            Cargo
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Diretor de Marketing"
                                                                {...field}
                                                                value={field.value || ''}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </FormRow>

                                        <FormRow>
                                            <FormField
                                                control={form.control}
                                                name="website"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-1">
                                                            <Globe className="h-3 w-3" />
                                                            Website
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="https://empresa.com"
                                                                {...field}
                                                                value={field.value || ''}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="taxId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-1">
                                                            <Hash className="h-3 w-3" />
                                                            ID Fiscal (CNPJ/VAT)
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="00.000.000/0001-00"
                                                                {...field}
                                                                value={field.value || ''}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </FormRow>

                                        <FormRow>
                                            <FormField
                                                control={form.control}
                                                name="industry"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Segmento</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value || undefined}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecione..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {INDUSTRIES.map((industry) => (
                                                                    <SelectItem key={industry} value={industry}>
                                                                        {industry}
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
                                                name="companySize"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Porte da Empresa</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value || undefined}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecione..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {COMPANY_SIZE_OPTIONS.map((option) => (
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
                                        </FormRow>
                                    </FormSection>
                                </TabsContent>

                                {/* === ABA LOCALIZAÇÃO === */}
                                <TabsContent value="location" className="mt-4 space-y-4">
                                    <FormSection>
                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Endereço</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Rua, número, complemento"
                                                            {...field}
                                                            value={field.value || ''}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormRow cols={3}>
                                            <FormField
                                                control={form.control}
                                                name="city"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Cidade</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="São Paulo"
                                                                {...field}
                                                                value={field.value || ''}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="state"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Estado/Região</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="SP"
                                                                {...field}
                                                                value={field.value || ''}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="postalCode"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>CEP/Postal</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="01234-567"
                                                                {...field}
                                                                value={field.value || ''}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </FormRow>

                                        <FormField
                                            control={form.control}
                                            name="country"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>País</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value || undefined}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecione o país..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {COUNTRIES.map((country) => (
                                                                <SelectItem key={country.code} value={country.code}>
                                                                    {country.flag} {country.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </FormSection>
                                </TabsContent>

                                {/* === ABA STATUS === */}
                                <TabsContent value="status" className="mt-4 space-y-4">
                                    <FormSection>
                                        <FormRow>
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
                                                                {LEAD_STATUS_OPTIONS.map((option) => (
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
                                                name="source"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Origem</FormLabel>
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
                                                                {LEAD_SOURCE_OPTIONS.map((option) => (
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
                                        </FormRow>

                                        <FormField
                                            control={form.control}
                                            name="notes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-1">
                                                        <FileText className="h-3 w-3" />
                                                        Notas
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Observações sobre o lead..."
                                                            rows={4}
                                                            {...field}
                                                            value={field.value || ''}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </FormSection>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>

                        <DialogFooter className="mt-4 pt-4 border-t">
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