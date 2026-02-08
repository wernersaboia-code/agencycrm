// components/companies/company-modal.tsx

"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { createCompany, updateCompany } from "@/actions/companies"

// Schema de validação
const companySchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
    domain: z.string().max(100, "Domínio muito longo").optional().or(z.literal("")),
    industry: z.string().max(50, "Indústria muito longa").optional().or(z.literal("")),
    size: z.string().optional().or(z.literal("")),
    website: z.string().url("URL inválida").optional().or(z.literal("")),
    description: z.string().max(1000, "Notas muito longas").optional().or(z.literal("")),
})

type CompanyFormValues = z.infer<typeof companySchema>

// Opções de tamanho da empresa
const companySizes = [
    { value: "1-10", label: "1-10 funcionários" },
    { value: "11-50", label: "11-50 funcionários" },
    { value: "51-200", label: "51-200 funcionários" },
    { value: "201-500", label: "201-500 funcionários" },
    { value: "501-1000", label: "501-1000 funcionários" },
    { value: "1000+", label: "1000+ funcionários" },
]

// Opções de indústria
const industries = [
    "Tecnologia",
    "Saúde",
    "Educação",
    "Finanças",
    "Varejo",
    "Manufatura",
    "Serviços",
    "Consultoria",
    "Marketing",
    "Logística",
    "Construção",
    "Alimentação",
    "Entretenimento",
    "Imobiliário",
    "Outros",
]

type Company = {
    id: string
    name: string
    domain?: string | null
    industry?: string | null
    size?: string | null
    website?: string | null
    description?: string | null
}

type CompanyModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    company?: Company | null
    onSuccess?: () => void
}

export function CompanyModal({
                                 open,
                                 onOpenChange,
                                 company,
                                 onSuccess,
                             }: CompanyModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const isEditing = !!company

    const form = useForm<CompanyFormValues>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: "",
            domain: "",
            industry: "",
            size: "",
            website: "",
            description: "",
        },
    })

    // Preenche o formulário quando editar
    useEffect(() => {
        if (company) {
            form.reset({
                name: company.name,
                domain: company.domain || "",
                industry: company.industry || "",
                size: company.size || "",
                website: company.website || "",
                description: company.description || "",
            })
        } else {
            form.reset({
                name: "",
                domain: "",
                industry: "",
                size: "",
                website: "",
                description: "",
            })
        }
    }, [company, form])

    async function onSubmit(values: CompanyFormValues) {
        setIsLoading(true)

        try {
            const result = isEditing
                ? await updateCompany(company.id, values)
                : await createCompany(values)

            if (result.success) {
                toast.success(
                    isEditing
                        ? "Empresa atualizada com sucesso!"
                        : "Empresa criada com sucesso!"
                )
                form.reset()
                onOpenChange(false)
                onSuccess?.()
            } else {
                toast.error(result.error || "Erro ao salvar empresa")
            }
        } catch (error) {
            toast.error("Erro inesperado ao salvar empresa")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Empresa" : "Nova Empresa"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Atualize as informações da empresa"
                            : "Preencha os dados para criar uma nova empresa"}
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
                                    <FormLabel>Nome *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome da empresa" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Domínio e Website */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="domain"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Domínio</FormLabel>
                                        <FormControl>
                                            <Input placeholder="empresa.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://empresa.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Indústria e Tamanho */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="industry"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Indústria</FormLabel>
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
                                                {industries.map((industry) => (
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
                                name="size"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tamanho</FormLabel>
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
                                                {companySizes.map((size) => (
                                                    <SelectItem key={size.value} value={size.value}>
                                                        {size.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Notas */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descrição da empresa..."
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