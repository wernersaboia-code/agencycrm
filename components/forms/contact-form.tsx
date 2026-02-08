// components/forms/contact-form.tsx

"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

import { contactFormSchema, ContactFormValues } from "@/lib/validations/contact"
import { ContactWithRelations } from "@/types/contact"
import { getCompaniesForSelect } from "@/actions/tasks"

interface ContactFormProps {
    contact?: ContactWithRelations | null
    onSubmit: (data: ContactFormValues) => Promise<void>
    isLoading?: boolean
    defaultCompanyId?: string
}

const statusOptions = [
    { value: "LEAD", label: "Lead" },
    { value: "ACTIVE", label: "Ativo" },
    { value: "CUSTOMER", label: "Cliente" },
    { value: "INACTIVE", label: "Inativo" },
    { value: "CHURNED", label: "Perdido" },
]

type CompanyOption = {
    id: string
    name: string
}

export function ContactForm({ contact, onSubmit, isLoading, defaultCompanyId }: ContactFormProps) {
    const [companies, setCompanies] = useState<CompanyOption[]>([])
    const [loadingCompanies, setLoadingCompanies] = useState(true)

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            firstName: contact?.firstName || "",
            lastName: contact?.lastName || "",
            email: contact?.email || "",
            phone: contact?.phone || "",
            mobile: contact?.mobile || "",
            position: contact?.position || "",
            department: contact?.department || "",
            status: contact?.status || "LEAD",
            source: contact?.source || "",
            notes: contact?.notes || "",
            companyId: contact?.companyId || defaultCompanyId || "",
        },
    })

    // Carregar empresas
    useEffect(() => {
        async function loadCompanies() {
            setLoadingCompanies(true)
            try {
                const result = await getCompaniesForSelect()
                if (result.success && result.data) {
                    setCompanies(result.data)
                }
            } catch (error) {
                console.error("Erro ao carregar empresas:", error)
            } finally {
                setLoadingCompanies(false)
            }
        }
        loadCompanies()
    }, [])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                <FormLabel>Sobrenome *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Silva" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Campo de Empresa */}
                <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Empresa
                            </FormLabel>
                            <Select
                                onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                                value={field.value || "none"}
                                disabled={loadingCompanies}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingCompanies ? "Carregando..." : "Selecione uma empresa"} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">Nenhuma empresa</SelectItem>
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

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="joao@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                    <Input placeholder="(11) 3333-4444" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="mobile"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Celular</FormLabel>
                                <FormControl>
                                    <Input placeholder="(11) 99999-8888" {...field} />
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o status" />
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cargo</FormLabel>
                                <FormControl>
                                    <Input placeholder="Gerente de Vendas" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Departamento</FormLabel>
                                <FormControl>
                                    <Input placeholder="Comercial" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Origem</FormLabel>
                            <FormControl>
                                <Input placeholder="Site, Indicação, LinkedIn..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Notas sobre o contato..."
                                    className="resize-none"
                                    rows={3}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {contact ? "Salvar alterações" : "Criar contato"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}