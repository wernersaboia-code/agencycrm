// components/admin/list-form.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
    Upload,
    FileSpreadsheet,
    Loader2,
    CheckCircle2,
    Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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

import { createList, updateList, uploadLeadsToList } from "@/actions/admin/lists"
import { MarketplaceImportWizard } from "@/components/admin/marketplace-import-wizard"
import type { MarketplaceLeadData } from "@/lib/constants/marketplace-csv.constants"

// ============================================
// SCHEMA
// ============================================

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

// ============================================
// TIPOS
// ============================================

interface SerializedLeadList {
    id: string
    name: string
    slug: string
    description: string | null
    category: string
    countries: string[]
    industries: string[]
    totalLeads: number
    price: number
    currency: string
    isActive: boolean
    isFeatured: boolean
    previewData: unknown
    createdAt: string
    updatedAt: string
}

interface ListFormProps {
    list?: SerializedLeadList
}

// ============================================
// CONSTANTES
// ============================================

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

// ============================================
// COMPONENTE
// ============================================

export function ListForm({ list }: ListFormProps) {
    const router = useRouter()

    // Estado do formulário
    const [isLoading, setIsLoading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    // Estado do wizard de importação
    const [showImportWizard, setShowImportWizard] = useState(false)

    // Estado dos leads preparados (para criação de nova lista)
    const [preparedLeads, setPreparedLeads] = useState<MarketplaceLeadData[]>([])

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

    // ============================================
    // HANDLERS
    // ============================================

    const onSubmit = async (data: ListFormData) => {
        setIsLoading(true)
        setUploadProgress(0)

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
                // EDITANDO lista existente
                await updateList(list.id, payload)
                toast.success("Lista atualizada com sucesso!")
                router.push("/super-admin/marketplace/lists")
                router.refresh()
            } else {
                // CRIANDO lista nova
                setUploadProgress(10)

                // 1. Criar a lista
                const newList = await createList(payload)
                setUploadProgress(30)

                // 2. Se tem leads preparados, importar
                if (preparedLeads.length > 0) {
                    setUploadProgress(50)

                    const result = await uploadLeadsToList(newList.id, preparedLeads)

                    setUploadProgress(100)
                    toast.success(`Lista criada com ${result.count} leads!`)
                } else {
                    toast.success("Lista criada com sucesso!")
                }

                router.push("/super-admin/marketplace/lists")
                router.refresh()
            }
        } catch (error) {
            toast.error("Erro ao salvar lista")
            console.error(error)
        } finally {
            setIsLoading(false)
            setUploadProgress(0)
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

    // Callback quando leads são preparados pelo wizard
    const handleLeadsPrepared = (leads: MarketplaceLeadData[]) => {
        setPreparedLeads(leads)

        // Auto-preencher países e setores do CSV
        const countriesFromLeads = [...new Set(leads.map((l) => l.country))]
        const sectorsFromLeads = [...new Set(leads.map((l) => l.sector).filter(Boolean))]

        if (countriesFromLeads.length > 0 && !form.getValues("countries")) {
            form.setValue("countries", countriesFromLeads.join(", "))
        }
        if (sectorsFromLeads.length > 0 && !form.getValues("industries")) {
            form.setValue("industries", sectorsFromLeads.join(", "))
        }
    }

    // Callback quando importação direta é concluída (modo edit)
    const handleImportSuccess = (count: number) => {
        toast.success(`${count} leads importados!`)
        router.refresh()
    }

    // Limpar leads preparados
    const handleClearPreparedLeads = () => {
        setPreparedLeads([])
    }

    // ============================================
    // RENDER
    // ============================================

    const isEditing = !!list
    const hasPreparedLeads = preparedLeads.length > 0

    return (
        <>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Card: Informações Básicas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informações Básicas</CardTitle>
                        <CardDescription>Dados principais da lista</CardDescription>
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
                                <Label htmlFor="countries">
                                    Países (códigos ISO) *
                                    {hasPreparedLeads && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                            Auto-preenchido
                                        </Badge>
                                    )}
                                </Label>
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
                            <Label htmlFor="industries">
                                Setores
                                {hasPreparedLeads && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                        Auto-preenchido
                                    </Badge>
                                )}
                            </Label>
                            <Input
                                id="industries"
                                placeholder="Alimentos, Bebidas, Orgânicos"
                                {...form.register("industries")}
                            />
                            <p className="text-xs text-muted-foreground">Separe por vírgula</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Card: Preço */}
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

                {/* Card: Importar Leads */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Importar Leads
                            <Badge variant="outline">Opcional</Badge>
                        </CardTitle>
                        <CardDescription>
                            {isEditing
                                ? "Adicione mais leads a esta lista"
                                : "Adicione leads diretamente ao criar a lista"
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            // MODO EDIÇÃO: Lista já existe
                            <div className="space-y-4">
                                <div className="p-4 bg-muted rounded-lg text-center">
                                    <p className="text-2xl font-bold">{list.totalLeads}</p>
                                    <p className="text-sm text-muted-foreground">leads nesta lista</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setShowImportWizard(true)}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Importar Mais Leads
                                </Button>
                            </div>
                        ) : hasPreparedLeads ? (
                            // MODO CRIAÇÃO: Já tem leads preparados
                            <div className="p-6 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                                        <div>
                                            <p className="text-xl font-bold text-green-800 dark:text-green-200">
                                                {preparedLeads.length} leads prontos!
                                            </p>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                Serão importados quando você criar a lista
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleClearPreparedLeads}
                                        className="text-green-700 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowImportWizard(true)}
                                        className="bg-white dark:bg-transparent"
                                    >
                                        Importar mais leads
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // MODO CRIAÇÃO: Nenhum lead ainda
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-32 border-dashed border-2 hover:border-primary/50 hover:bg-muted/50 transition-colors"
                                onClick={() => setShowImportWizard(true)}
                            >
                                <div className="text-center">
                                    <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                                    <p className="font-medium">Clique para importar CSV ou Excel</p>
                                    <p className="text-sm text-muted-foreground">
                                        Formatos: .csv, .xlsx, .xls
                                    </p>
                                </div>
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Card: Configurações */}
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

                {/* Progress durante criação */}
                {isLoading && uploadProgress > 0 && (
                    <div className="space-y-2">
                        <Progress value={uploadProgress} />
                        <p className="text-sm text-center text-muted-foreground">
                            {uploadProgress < 30 && "Criando lista..."}
                            {uploadProgress >= 30 && uploadProgress < 100 && "Importando leads..."}
                            {uploadProgress === 100 && "Concluído!"}
                        </p>
                    </div>
                )}

                {/* Botões de Ação */}
                <div className="flex gap-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {isEditing ? "Salvando..." : "Criando..."}
                            </>
                        ) : isEditing ? (
                            "Salvar Alterações"
                        ) : hasPreparedLeads ? (
                            `Criar Lista com ${preparedLeads.length} Leads`
                        ) : (
                            "Criar Lista"
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                </div>
            </form>

            {/* Wizard de Importação */}
            <MarketplaceImportWizard
                open={showImportWizard}
                onOpenChange={setShowImportWizard}
                mode={isEditing ? "import" : "prepare"}
                listId={list?.id}
                listName={form.watch("name") || "Nova Lista"}
                onSuccess={handleImportSuccess}
                onLeadsPrepared={handleLeadsPrepared}
            />
        </>
    )
}