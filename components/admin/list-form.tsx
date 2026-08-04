// components/admin/list-form.tsx
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import {
    Upload,
    FileSpreadsheet,
    Loader2,
    CheckCircle2,
    Trash2,
    X,
    FileText,
    BadgeCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
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

import { createList, updateList, uploadLeadsToList, markListReviewed } from "@/actions/admin/lists"
import { MarketplaceImportWizard } from "@/components/admin/marketplace-import-wizard"
import type { MarketplaceLeadData } from "@/lib/constants/marketplace-csv.constants"
import { LIST_LANGUAGES } from "@/lib/constants/list-languages"
import { INDUSTRY_IDS } from "@/lib/constants/catalog-facets"
import { FlagIcon } from "@/components/ui/flag-icon"
import { canPublishList } from "@/lib/marketplace/list-publishing"

// ============================================
// TIPOS
// ============================================

interface SerializedLeadList {
    id: string
    name: string
    slug: string
    description: string | null
    introduction: string | null
    language: string | null
    studyPdfUrl: string | null
    studyPdfName: string | null
    countries: string[]
    industries: string[]
    totalLeads: number
    price: number
    currency: string
    /** Preços cadastrados por moeda. EUR sempre existe nas listas semeadas. */
    prices?: { EUR?: number; BRL?: number; USD?: number }
    isActive: boolean
    isFeatured: boolean
    previewData: unknown
    createdAt: string
    updatedAt: string
    dataReviewedAt: string | null
}

interface ListFormProps {
    list?: SerializedLeadList
}

// ============================================
// CONSTANTES
// ============================================

// Vocabulário e rótulos vêm da mesma fonte que o filtro público (ver
// lib/constants/catalog-facets.ts): setor oferecido aqui e não conhecido lá
// gerava lista impossível de encontrar no catálogo.

// ============================================
// COMPONENTE
// ============================================

export function ListForm({ list }: ListFormProps) {
    const router = useRouter()
    const t = useTranslations("admin.components.listForm")
    const tc = useTranslations("admin.common")
    // Rótulos das facetas: os mesmos que o catálogo público mostra.
    const tFacetas = useTranslations("catalog")

    const listSchema = useMemo(() => z.object({
        name: z.string().min(3, t("validationName")),
        slug: z.string().min(3, t("validationSlug"))
            .regex(/^[a-z0-9-]+$/, t("validationSlugFormat")),
        description: z.string().optional(),
        introduction: z.string().optional(),
        language: z.string().optional(),
        countries: z.string().min(1, t("validationCountry")),
        industries: z.string().optional(),
        // Um campo por moeda. EUR e BRL são obrigatórios: EUR é a referência
        // da vitrine, BRL é a moeda em que o Mercado Pago cobra. Só USD é opcional.
        price: z.string().min(1, t("validationPrice")),
        priceBRL: z.string().min(1, t("validationPriceBrl")),
        priceUSD: z.string().optional(),
        totalLeads: z.string().regex(/^\d*$/, t("validationInteger")).optional(),
        isActive: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
    }), [t])

    type ListFormData = z.infer<typeof listSchema>

    // Estado do formulário
    const [isLoading, setIsLoading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    // Estado do wizard de importação
    const [showImportWizard, setShowImportWizard] = useState(false)

    // Estado dos leads preparados (para criação de nova lista)
    const [preparedLeads, setPreparedLeads] = useState<MarketplaceLeadData[]>([])

    // Data de revisão dos DADOS — só muda por ação explícita do admin.
    const [dataReviewedAt, setDataReviewedAt] = useState<string | null>(list?.dataReviewedAt ?? null)
    const [isMarkingReviewed, setIsMarkingReviewed] = useState(false)

    const [pdfFile, setPdfFile] = useState<File | null>(null)
    const [pdfName, setPdfName] = useState<string | null>(list?.studyPdfName ?? null)

    // Estado das indústrias selecionadas
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
        list?.industries || []
    )

    const form = useForm<ListFormData>({
        mode: "onBlur",
        resolver: zodResolver(listSchema) as Resolver<ListFormData>,
        defaultValues: {
            name: list?.name || "",
            slug: list?.slug || "",
            description: list?.description || "",
            introduction: list?.introduction || "",
            language: list?.language || "",
            countries: list?.countries.join(", ") || "",
            industries: list?.industries.join(", ") || "",
            price: list ? String(list.prices?.EUR ?? list.price) : "",
            priceBRL: list?.prices?.BRL !== undefined ? String(list.prices.BRL) : "",
            priceUSD: list?.prices?.USD !== undefined ? String(list.prices.USD) : "",
            totalLeads: list ? String(list.totalLeads) : "",
            isActive: list?.isActive ?? true,
            isFeatured: list?.isFeatured ?? false,
        },
    })

    // ============================================
    // HANDLERS
    // ============================================

    const toggleIndustry = (industryId: string) => {
        setSelectedIndustries((prev) => {
            const newSelected = prev.includes(industryId)
                ? prev.filter((id) => id !== industryId)
                : [...prev, industryId]

            form.setValue("industries", newSelected.join(", "), { shouldDirty: true })
            return newSelected
        })
    }

    const removeIndustry = (industryId: string) => {
        setSelectedIndustries((prev) => {
            const newSelected = prev.filter((id) => id !== industryId)
            form.setValue("industries", newSelected.join(", "), { shouldDirty: true })
            return newSelected
        })
    }

    const onSubmit = async (data: ListFormData) => {
        // Gate client-side: reusa a mesma mensagem do gate do servidor
        // (canPublishList) para não deixar o admin tentar ativar sem PDF e só
        // descobrir o motivo depois de uma chamada ao servidor.
        if (list && data.isActive) {
            const effectivePdfUrl = pdfFile ? "pending-upload" : list.studyPdfUrl
            const check = canPublishList({
                studyPdfUrl: effectivePdfUrl,
                dataReviewedAt: dataReviewedAt ? new Date(dataReviewedAt) : null,
            })
            if (!check.ok) {
                toast.error(check.reason)
                return
            }
        }

        setIsLoading(true)
        setUploadProgress(0)

        const uploadPdf = async (listId: string): Promise<boolean> => {
            if (!pdfFile) return true
            try {
                const body = new FormData()
                body.append("file", pdfFile)
                const res = await fetch(`/api/admin/lists/${listId}/pdf`, { method: "POST", body })
                return res.ok
            } catch (error) {
                console.error("Erro ao enviar PDF:", error)
                return false
            }
        }

        try {
            // Campo vazio = a lista deixa de ter preço naquela moeda (a linha é
            // apagada por writeListPrices), não zero.
            const optionalPrice = (value?: string) => {
                const trimmed = value?.trim()
                return trimmed ? parseFloat(trimmed) : undefined
            }

            const { priceBRL, priceUSD, price, ...rest } = data
            const payload = {
                ...rest,
                prices: {
                    EUR: parseFloat(price),
                    BRL: parseFloat(priceBRL),
                    USD: optionalPrice(priceUSD),
                },
                countries: data.countries.split(",").map((c) => c.trim().toUpperCase()),
                industries: selectedIndustries, // Usar array direto
                introduction: data.introduction || undefined,
                language: data.language || undefined,
                // Campo vazio = não informado: a action preserva o valor
                // atual na edição (e grava 0 na criação).
                totalLeads: data.totalLeads?.trim()
                    ? parseInt(data.totalLeads, 10)
                    : undefined,
            }

            if (list) {
                // EDITANDO lista existente: envia o PDF ANTES de salvar os
                // dados, para que — se isActive=true nesta mesma submissão —
                // o gate do servidor (canPublishList) já veja o PDF recém
                // anexado em vez do studyPdfUrl antigo.
                const pdfOk = await uploadPdf(list.id)
                const updated = await updateList(list.id, payload)
                // A action devolve a falha em vez de lançá-la (o Next apagaria
                // a mensagem em produção), então o motivo real chega aqui.
                if (!updated.success) {
                    toast.error(updated.error)
                    return
                }
                if (pdfOk) {
                    toast.success(t("toastUpdated"))
                } else {
                    toast.warning(t("toastPdfFailed"))
                }
                router.push("/super-admin/marketplace/lists")
                router.refresh()
            } else {
                // CRIANDO lista nova
                setUploadProgress(10)

                // 1. Criar a lista (sempre inativa: o PDF só existe depois
                // que a lista tem id, então uma lista nova nunca pode nascer
                // publicada — ative-a depois de anexar o PDF)
                const created = await createList(payload)
                if (!created.success) {
                    toast.error(created.error)
                    return
                }

                const newList = created.data
                const pdfOk = await uploadPdf(newList.id)
                setUploadProgress(30)

                // 2. Se tem leads preparados, importar
                if (preparedLeads.length > 0) {
                    setUploadProgress(50)

                    const result = await uploadLeadsToList(newList.id, preparedLeads)

                    setUploadProgress(100)
                    toast.success(t("toastCreated", { count: result.count }))
                } else {
                    toast.success(t("toastCreatedSimple"))
                }

                // 3. Avisar se PDF falhou
                if (!pdfOk) {
                    toast.warning(t("toastPdfFailed"))
                }

                if (data.isActive) {
                    toast.info(
                        pdfOk
                            ? t("toastCreatedInactive1")
                            : t("toastCreatedInactive2")
                    )
                }

                router.push("/super-admin/marketplace/lists")
                router.refresh()
            }
        } catch (error) {
            const message = error instanceof Error && error.message ? error.message : t("toastSaveError")
            toast.error(message)
            console.error(error)
        } finally {
            setIsLoading(false)
            setUploadProgress(0)
        }
    }

    // Auto-generate slug from name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value
        form.setValue("name", name, { shouldDirty: true })

        if (!list) {
            const slug = name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
            form.setValue("slug", slug, { shouldDirty: true })
        }
    }

    // Callback quando leads são preparados pelo wizard
    const handleLeadsPrepared = (leads: MarketplaceLeadData[]) => {
        setPreparedLeads(leads)

        // Auto-preencher países do CSV
        const countriesFromLeads = [...new Set(leads.map((l) => l.country))]

        if (countriesFromLeads.length > 0 && !form.getValues("countries")) {
            form.setValue("countries", countriesFromLeads.join(", "), { shouldDirty: true })
        }

        // Auto-preencher setores do CSV (se tiver)
        const sectorsFromLeads = leads
            .map((l) => l.sector)
            .filter((s): s is string => typeof s === "string" && s.length > 0)

        if (sectorsFromLeads.length > 0 && selectedIndustries.length === 0) {
            // Mapear a coluna "Sector" do CSV para os três setores do catálogo.
            //
            // A sugestão é um atalho, não a verdade: o admin confere e ajusta
            // nos checkboxes. Setor que não casa com nenhum dos três não vira
            // palpite — é melhor deixar em branco do que marcar FMCG numa
            // lista de HoReCa e o estudo aparecer no filtro errado.
            const mappedIndustries: string[] = []

            sectorsFromLeads.forEach((sector) => {
                const lowerSector = sector.toLowerCase()
                let industryId: string | null = null

                if (
                    lowerSector.includes("horeca") ||
                    lowerSector.includes("foodservice") ||
                    lowerSector.includes("food service") ||
                    lowerSector.includes("hotel") ||
                    lowerSector.includes("catering") ||
                    lowerSector.includes("restaur")
                ) {
                    industryId = "horeca"
                } else if (
                    lowerSector.includes("exotic") ||
                    lowerSector.includes("exótic") ||
                    lowerSector.includes("exotisch")
                ) {
                    industryId = "exotic_fruits"
                } else if (lowerSector.includes("fmcg")) {
                    industryId = "fmcg"
                }

                if (industryId && !mappedIndustries.includes(industryId)) {
                    mappedIndustries.push(industryId)
                }
            })

            if (mappedIndustries.length > 0) {
                setSelectedIndustries(mappedIndustries)
                form.setValue("industries", mappedIndustries.join(", "), { shouldDirty: true })
            }
        }
    }

    // Callback quando importação direta é concluída (modo edit)
    const handleImportSuccess = (count: number) => {
        toast.success(t("toastLeadsImported", { count }))
        router.refresh()
    }

    // Marcar que os dados desta lista foram revisados agora
    const handleMarkReviewed = async () => {
        if (!list) return
        setIsMarkingReviewed(true)
        try {
            const reviewedAt = await markListReviewed(list.id)
            setDataReviewedAt(reviewedAt)
            toast.success(t("toastReviewSuccess"))
            router.refresh()
        } catch (error) {
            const message = error instanceof Error && error.message ? error.message : t("toastReviewError")
            toast.error(message)
            console.error(error)
        } finally {
            setIsMarkingReviewed(false)
        }
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

    // Campo de número de leads, compartilhado pelos três estados do card de
    // importação (criação vazia, criação com leads preparados, edição).
    const totalLeadsField = (
        <div className="space-y-2">
            <Label htmlFor="totalLeads">{t("leadCount")}</Label>
            <Input
                id="totalLeads"
                type="text"
                inputMode="numeric"
                placeholder="0"
                {...form.register("totalLeads")}
            />
            <p className="text-xs text-muted-foreground">
                {t("leadCountDesc")}
            </p>
            {form.formState.errors.totalLeads && (
                <p className="text-sm text-destructive">
                    {form.formState.errors.totalLeads.message}
                </p>
            )}
        </div>
    )

    return (
        <>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Card: Informações Básicas */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t("basicInfo")}</CardTitle>
                        <CardDescription>{t("basicInfoDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t("nameLabel")}</Label>
                                <Input
                                    id="name"
                                    placeholder={t("namePlaceholder")}
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
                                <Label htmlFor="slug">{t("slugLabel")}</Label>
                                <Input
                                    id="slug"
                                    placeholder={t("slugPlaceholder")}
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
                            <Label htmlFor="description">{t("descriptionLabel")}</Label>
                            <Textarea
                                id="description"
                                placeholder={t("descriptionPlaceholder")}
                                rows={4}
                                {...form.register("description")}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="language">{t("languageLabel")}</Label>
                                <Select
                                    value={form.watch("language")}
                                                    onValueChange={(value) => form.setValue("language", value, { shouldDirty: true })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("languagePlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LIST_LANGUAGES.map((lang) => (
                                            <SelectItem key={lang.code} value={lang.code}>
                                                <span className="flex items-center gap-2">
                                                    <FlagIcon code={lang.flagCode} size="sm" />
                                                    {lang.label}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="introduction">{t("introLabel")}</Label>
                            <Textarea
                                id="introduction"
                                placeholder={t("introPlaceholder")}
                                rows={6}
                                {...form.register("introduction")}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="countries">
                                    {t("countriesLabel")}
                                    {hasPreparedLeads && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                            {t("autoFilled")}
                                        </Badge>
                                    )}
                                </Label>
                                <Input
                                    id="countries"
                                    placeholder={t("countriesPlaceholder")}
                                    {...form.register("countries")}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t("countriesHint")}
                                </p>
                                {form.formState.errors.countries && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.countries.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* NOVO: Seletor de Indústrias */}
                        <div className="space-y-3">
                            <Label>
                                {t("industriesLabel")}
                                {hasPreparedLeads && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                        {t("autoFilled")}
                                    </Badge>
                                )}
                            </Label>

                            {/* Badges das selecionadas */}
                            {selectedIndustries.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                                    {selectedIndustries.map((id) => {
                                        return (
                                            <Badge
                                                key={id}
                                                variant="secondary"
                                                className="gap-1 pr-1"
                                            >
                                                {tFacetas(`industries.${id}`)}
                                                <button
                                                    type="button"
                                                    onClick={() => removeIndustry(id)}
                                                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Grid de checkboxes */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg">
                                {INDUSTRY_IDS.map((industryId) => (
                                    <label
                                        key={industryId}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                                    >
                                        <Checkbox
                                            checked={selectedIndustries.includes(industryId)}
                                            onCheckedChange={() => toggleIndustry(industryId)}
                                        />
                                        <span className="text-sm">{tFacetas(`industries.${industryId}`)}</span>
                                    </label>
                                ))}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                {t("industriesDesc")}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Card: Preço */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t("priceSection")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="price">{t("priceLabelEur")}</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    placeholder="45.00"
                                    {...form.register("price")}
                                />
                                {form.formState.errors.price && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.price.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priceBRL">{t("priceLabelBrl")}</Label>
                                <Input
                                    id="priceBRL"
                                    type="number"
                                    step="0.01"
                                    placeholder="289.00"
                                    {...form.register("priceBRL")}
                                />
                                {form.formState.errors.priceBRL && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.priceBRL.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priceUSD">{t("priceLabelUsd")}</Label>
                                <Input
                                    id="priceUSD"
                                    type="number"
                                    step="0.01"
                                    placeholder="49.00"
                                    {...form.register("priceUSD")}
                                />
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {t("priceOptionalNote")}
                        </p>
                    </CardContent>
                </Card>

                {/* Card: Importar Leads */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            {t("importSection")}
                            <Badge variant="outline">{t("optional")}</Badge>
                        </CardTitle>
                        <CardDescription>
                            {isEditing
                                ? t("importEditDesc")
                                : t("importCreateDesc")
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            // MODO EDIÇÃO: Lista já existe
                            <div className="space-y-4">
                                {totalLeadsField}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setShowImportWizard(true)}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {t("importMore")}
                                </Button>
                            </div>
                        ) : hasPreparedLeads ? (
                            // MODO CRIAÇÃO: Já tem leads preparados
                            <div className="space-y-4">
                                {totalLeadsField}
                                <div className="p-6 bg-admin-soft dark:bg-admin-soft/30 rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <CheckCircle2 className="h-10 w-10 text-admin" />
                                        <div>
                                            <p className="text-xl font-bold text-admin dark:text-admin-soft">
                                                {t("leadsReady", { count: preparedLeads.length })}
                                            </p>
                                            <p className="text-sm text-admin dark:text-admin">
                                                {t("willImportOnCreate")}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleClearPreparedLeads}
                                        className="text-admin hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="mt-4 pt-4 border-t border-admin-soft dark:border-admin-soft">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowImportWizard(true)}
                                        className="bg-white dark:bg-transparent"
                                    >
                                        {t("importMoreButton")}
                                    </Button>
                                </div>
                                </div>
                            </div>
                        ) : (
                            // MODO CRIAÇÃO: Nenhum lead ainda
                            <div className="space-y-4">
                                {totalLeadsField}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-32 border-dashed border-2 hover:border-primary/50 hover:bg-muted/50 transition-colors"
                                    onClick={() => setShowImportWizard(true)}
                                >
                                    <div className="text-center">
                                        <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                                        <p className="font-medium">{t("clickToImport")}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {t("formats")}
                                        </p>
                                    </div>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Card: Estudo de mercado (PDF) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {t("pdfSection")}
                        </CardTitle>
                        <CardDescription>
                            {t("pdfDesc")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Input
                            id="studyPdf"
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => {
                                const file = e.target.files?.[0] ?? null
                                setPdfFile(file)
                                if (file) setPdfName(file.name)
                            }}
                        />
                        {pdfName && (
                            <p className="text-sm text-muted-foreground">
                                {t("currentFile")} <span className="font-medium">{pdfName}</span>
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            {t("pdfHint")}
                        </p>
                    </CardContent>
                </Card>

                {/* Card: Configurações */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t("settingsSection")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="isActive">{t("activeLabel")}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {isEditing
                                            ? t("activeDesc")
                                            : t("activeNewDesc")}
                                    </p>
                                </div>
                                <Switch
                                    id="isActive"
                                    checked={form.watch("isActive")}
                                    onCheckedChange={(checked) => form.setValue("isActive", checked, { shouldDirty: true })}
                                />
                            </div>
                            {isEditing && form.watch("isActive") && (() => {
                                const effectivePdfUrl = pdfFile ? "pending-upload" : list!.studyPdfUrl
                                const check = canPublishList({
                                    studyPdfUrl: effectivePdfUrl,
                                    dataReviewedAt: dataReviewedAt ? new Date(dataReviewedAt) : null,
                                })
                                if (check.ok) return null
                                return (
                                    <p className="text-sm text-destructive">{check.reason}</p>
                                )
                            })()}
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="isFeatured">{t("featuredLabel")}</Label>
                                <p className="text-sm text-muted-foreground">
                                    {t("featuredDesc")}
                                </p>
                            </div>
                            <Switch
                                id="isFeatured"
                                checked={form.watch("isFeatured")}
                                onCheckedChange={(checked) => form.setValue("isFeatured", checked, { shouldDirty: true })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Card: Revisão dos dados (só na edição — precisa de id) */}
                {isEditing && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BadgeCheck className="h-5 w-5" />
                                {t("reviewSection")}
                            </CardTitle>
                            <CardDescription>
                                {t("reviewDesc")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                {dataReviewedAt
                                    ? t("lastReview", { date: new Date(dataReviewedAt).toLocaleDateString("pt-BR") })
                                    : t("noReview")}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleMarkReviewed}
                                disabled={isMarkingReviewed}
                            >
                                {isMarkingReviewed ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t("registering")}
                                    </>
                                ) : (
                                    t("markReviewed")
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Progress durante criação */}
                {isLoading && uploadProgress > 0 && (
                    <div className="space-y-2">
                        <Progress value={uploadProgress} />
                        <p className="text-sm text-center text-muted-foreground">
                            {uploadProgress < 30 && t("creatingList")}
                            {uploadProgress >= 30 && uploadProgress < 100 && t("importingLeads")}
                            {uploadProgress === 100 && t("completed")}
                        </p>
                    </div>
                )}

                {/* Botões de Ação */}
                <div className="flex gap-4">
                    <Button type="submit" disabled={isLoading || (!form.formState.isDirty && !pdfFile)}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {isEditing ? tc("saving") : t("creating")}
                                    </>
                                ) : isEditing ? (
                                    t("saveChanges")
                                ) : hasPreparedLeads ? (
                                    t("createWithLeads", { count: preparedLeads.length })
                                ) : (
                                    t("createList")
                                )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isLoading}
                    >
                        {t("cancel")}
                    </Button>
                </div>
            </form>

            {/* Wizard de Importação */}
            <MarketplaceImportWizard
                open={showImportWizard}
                onOpenChange={setShowImportWizard}
                mode={isEditing ? "import" : "prepare"}
                listId={list?.id}
                listName={form.watch("name") || t("newList")}
                onSuccess={handleImportSuccess}
                onLeadsPrepared={handleLeadsPrepared}
            />
        </>
    )
}
