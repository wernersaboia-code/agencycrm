// components/admin/list-form.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { createList, updateList } from "@/actions/admin/lists"
import type { LeadList } from "@prisma/client"

const listSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    slug: z.string().min(3, "Slug deve ter pelo menos 3 caracteres")
        .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
    description: z.string().optional(),
    category: z.string().min(1, "Selecione uma categoria"),
    countries: z.string().min(1, "Informe pelo menos um país"),
    industries: z.string().optional(),
    price: z.string().min(1, "Informe o preço"),
    currency: z.string().default("EUR"),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
})

type ListFormData = z.infer<typeof listSchema>

interface SerializedLeadList {
    id: string
    name: string
    slug: string
    description: string | null
    category: string
    countries: string[]
    industries: string[]
    totalLeads: number
    price: number  // Já convertido
    currency: string
    isActive: boolean
    isFeatured: boolean
    previewData: unknown
    createdAt: string  // ISO string
    updatedAt: string  // ISO string
}

interface ListFormProps {
    list?: SerializedLeadList
}

const categories = [
    { value: "importers", label: "Importadores" },
    { value: "exporters", label: "Exportadores" },
    { value: "manufacturers", label: "Fabricantes" },
    { value: "distributors", label: "Distribuidores" },
    { value: "retailers", label: "Varejistas" },
    { value: "wholesalers", label: "Atacadistas" },
]

const currencies = [
    { value: "EUR", label: "Euro (€)" },
    { value: "USD", label: "Dólar ($)" },
    { value: "BRL", label: "Real (R$)" },
]

export function ListForm({ list }: ListFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<ListFormData>({
        resolver: zodResolver(listSchema) as any,
        defaultValues: {
            name: list?.name || "",
            slug: list?.slug || "",
            description: list?.description || "",
            category: list?.category || "",
            countries: list?.countries.join(", ") || "",
            industries: list?.industries.join(", ") || "",
            price: list ? String(list.price) : "",
            currency: list?.currency || "EUR",
            isActive: list?.isActive ?? true,
            isFeatured: list?.isFeatured ?? false,
        },
    })

    const onSubmit = async (data: ListFormData) => {
        setIsLoading(true)

        try {
            const payload = {
                ...data,
                price: parseFloat(data.price),
                countries: data.countries.split(",").map((c) => c.trim().toUpperCase()),
                industries: data.industries
                    ? data.industries.split(",").map((i) => i.trim())
                    : [],
            }

            if (list) {
                await updateList(list.id, payload)
                toast.success("Lista atualizada com sucesso!")
            } else {
                await createList(payload)
                toast.success("Lista criada com sucesso!")
            }

            router.push("/admin/lists")
            router.refresh()
        } catch (error) {
            toast.error("Erro ao salvar lista")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    // Auto-generate slug from name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value
        form.setValue("name", name)

        if (!list) {
            const slug = name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
            form.setValue("slug", slug)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                    <CardDescription>
                        Dados principais da lista
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Lista *</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Importadores de Alimentos - Alemanha"
                                {...form.register("name")}
                                onChange={handleNameChange}
                            />
                            {form.formState.errors.name && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug (URL) *</Label>
                            <Input
                                id="slug"
                                placeholder="importadores-alimentos-alemanha"
                                {...form.register("slug")}
                            />
                            {form.formState.errors.slug && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.slug.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea
                            id="description"
                            placeholder="Descrição detalhada da lista..."
                            rows={4}
                            {...form.register("description")}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoria *</Label>
                            <Select
                                value={form.watch("category")}
                                onValueChange={(value) => form.setValue("category", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.category && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.category.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="countries">Países (códigos ISO) *</Label>
                            <Input
                                id="countries"
                                placeholder="DE, AT, CH"
                                {...form.register("countries")}
                            />
                            <p className="text-xs text-muted-foreground">
                                Separe por vírgula: DE, FR, IT
                            </p>
                            {form.formState.errors.countries && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.countries.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="industries">Setores</Label>
                        <Input
                            id="industries"
                            placeholder="Alimentos, Bebidas, Orgânicos"
                            {...form.register("industries")}
                        />
                        <p className="text-xs text-muted-foreground">
                            Separe por vírgula
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="price">Preço *</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                placeholder="297.00"
                                {...form.register("price")}
                            />
                            {form.formState.errors.price && (
                                <p className="text-sm text-destructive">
                                    {form.formState.errors.price.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currency">Moeda</Label>
                            <Select
                                value={form.watch("currency")}
                                onValueChange={(value) => form.setValue("currency", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencies.map((curr) => (
                                        <SelectItem key={curr.value} value={curr.value}>
                                            {curr.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Configurações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="isActive">Lista Ativa</Label>
                            <p className="text-sm text-muted-foreground">
                                Listas inativas não aparecem no catálogo
                            </p>
                        </div>
                        <Switch
                            id="isActive"
                            checked={form.watch("isActive")}
                            onCheckedChange={(checked) => form.setValue("isActive", checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="isFeatured">Destaque</Label>
                            <p className="text-sm text-muted-foreground">
                                Aparecer em destaque na página inicial
                            </p>
                        </div>
                        <Switch
                            id="isFeatured"
                            checked={form.watch("isFeatured")}
                            onCheckedChange={(checked) => form.setValue("isFeatured", checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {list ? "Salvar Alterações" : "Criar Lista"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                >
                    Cancelar
                </Button>
            </div>
        </form>
    )
}