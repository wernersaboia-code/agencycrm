import { notFound } from "next/navigation"
import { Link } from "@/lib/i18n/navigation"
import { Suspense } from "react"
import type { ComponentType, ReactNode } from "react"
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { ListPreview, toRows } from "@/components/marketplace/list-preview"
import { ListPriceBox } from "@/components/marketplace/list-price-box"
import { Badge } from "@/components/ui/badge"
import { getListLanguage } from "@/lib/constants/list-languages"
import { FlagIcon } from "@/components/ui/flag-icon"
import { JsonLd } from "@/components/seo/json-ld"
import { buildProductSchema, buildBreadcrumbSchema, buildListBreadcrumbTrail } from "@/lib/seo/schema"
import { canonicalDefaultLocale } from "@/lib/i18n/alternates"
import { ROBOTS_NAO_ENCONTRADO } from "@/lib/seo/indexability"
import {
    ArrowLeft,
    BadgeCheck,
    Building2,
    Calendar,
    FileText,
    Globe,
    Shield,
    Target,
    Users,
} from "lucide-react"

/**
 * A ficha do estudo é pré-renderizada e revalidada de hora em hora, em vez de
 * montada a cada requisição. Antes ela era dinâmica sem precisar: o único
 * pedaço que dependia da requisição era a moeda do cookie, que foi para o
 * cliente (ListPriceBox).
 *
 * O que isso muda para a indexação: são 77 fichas, e cada visita do Googlebot
 * custava um render de origem com duas consultas ao banco, sem nada em cache
 * na CDN (`Cache-Control: private, no-store`). Página estática é servida da
 * borda, e o rastreio deixa de competir com o tráfego real pelo mesmo custo.
 *
 * Uma hora pelo mesmo motivo de app/sitemap.ts: é curto o bastante para uma
 * lista tirada do ar não sobreviver muito à decisão (em 23.08.2026 duas listas
 * de teste continuaram sendo servidas horas depois de desativadas) e longo o
 * bastante para o arquivo não ser reconstruído a cada visita de robô.
 */
export const revalidate = 3600

/**
 * Pré-renderiza as fichas de todos os estudos ativos.
 *
 * Sem isto o Next trata a rota como dinâmica por não conhecer nenhum slug no
 * build — e `revalidate` sozinho não muda isso. A página era montada a cada
 * requisição, com duas consultas ao banco e `Cache-Control: no-store`; cada
 * visita do Googlebot a cada uma das 77 fichas pagava esse preço, para chegar
 * sempre no mesmo HTML (robô não manda cookie de moeda).
 *
 * Devolve só `{ slug }`: o Next combina com os params do layout de `[locale]`,
 * o que dá os 8 idiomas por estudo. Emitir apenas o locale padrão seria mais
 * barato no build, mas o layout fixa `dynamicParams = false` — e isso vale
 * para a subárvore, então par (idioma, slug) fora desta lista responderia 404
 * em vez de renderizar sob demanda. Já custou uma regressão: com só o pt na
 * lista, `/de/list/<slug>` parou de existir.
 *
 * Consequência a vigiar: estudo publicado depois do deploy só aparece no
 * próximo build. É o mesmo compromisso que o `revalidate` do sitemap assume, e
 * o admin publica em lote, não a cada minuto — mas se isso mudar, o caminho é
 * revalidação sob demanda (revalidatePath) no fluxo de publicação.
 */
export async function generateStaticParams() {
    const lists = await prisma.leadList.findMany({
        where: { isActive: true },
        select: { slug: true },
        take: 1000,
    })

    return lists.map((list) => ({ slug: list.slug }))
}

interface ListPageProps {
    params: Promise<{ locale: string; slug: string }>
}

async function getList(slug: string) {
    return prisma.leadList.findUnique({
        where: {
            slug,
            isActive: true,
        },
    })
}

export async function generateMetadata({ params }: ListPageProps) {
    const { slug } = await params
    const [list, t] = await Promise.all([getList(slug), getTranslations("listing")])

    if (!list) {
        return { title: t("notFound"), robots: ROBOTS_NAO_ENCONTRADO }
    }

    return {
        // metaTitle/metaDescription são escritos no idioma do país do estudo e
        // com o vocabulário que o comprador digita na busca; name/description
        // vêm da capa do PDF, em inglês. Quando os primeiros existem, mandam.
        title: list.metaTitle || list.name,
        description: list.metaDescription || list.description || t("metaFallbackDescription"),
        // Uma lista = uma página indexável. O conteúdo vem do banco num só
        // idioma; /de/list, /fr/list… traduzem apenas a interface, então todas
        // as variantes canonizam para a URL do locale padrão e o Google
        // consolida os sinais numa URL só. Ver app/sitemap.ts.
        alternates: canonicalDefaultLocale(`/list/${slug}`),
    }
}

export default async function ListPage({ params }: ListPageProps) {
    const { locale, slug } = await params
    // Sem isto, o next-intl resolve o idioma lendo o header da requisição e a
    // rota volta a ser dinâmica — o layout já chama setRequestLocale, mas a
    // chamada é por segmento renderizado, e `[slug]` não é conhecido no build.
    setRequestLocale(locale)

    const [list, t, tCatalog, format] = await Promise.all([
        getList(slug),
        getTranslations("listing"),
        getTranslations("catalog"),
        getFormatter(),
    ])

    if (!list) {
        notFound()
    }

    const priceRows = await prisma.leadListPrice.findMany({
        where: { listId: list.id },
        select: { currency: true, amount: true },
    })
    // Formatado no locale ativo: "fev. de 2026" para um leitor alemão é ruído.
    const dateFormat = { day: "2-digit", month: "short", year: "numeric" } as const
    const updatedAt = format.dateTime(new Date(list.updatedAt), dateFormat)
    // Sinal de frescor real. Quando nunca houve revisão registrada o campo
    // simplesmente não aparece — cair de volta em updatedAt (que muda a
    // qualquer edição) seria exibir um frescor que não existe.
    const dataReviewedAt = list.dataReviewedAt
        ? format.dateTime(new Date(list.dataReviewedAt), dateFormat)
        : null
    // Mesmo filtro de toRows() (list-preview.tsx): entradas sem companyName não
    // viram linha na tabela, então não podem contar para o "amostra de N".
    const previewCount = toRows(list.previewData).length
    const language = getListLanguage(list.language)
    // O servidor não escolhe mais UMA moeda — manda todas e quem elege é o
    // cliente (ListPriceBox). Ler o cookie de moeda aqui tornava a ficha
    // dinâmica, e são 77 delas: cada visita do Googlebot custava um render de
    // origem sem nada em cache, para chegar sempre no euro (robô não manda
    // cookie). O JSON-LD já operava assim, declarando as ofertas que existem
    // em vez de eleger uma — agora a caixa de preço segue o mesmo princípio.
    //
    // NUNCA junte um valor com `list.currency`: são pares de fontes diferentes
    // e o resultado é um número com o código de moeda errado.
    const precos = priceRows.map((row) => ({ currency: row.currency, amount: Number(row.amount) }))
    const precoLegado = { amount: Number(list.price), currency: list.currency }
    const ofertas = precos.length > 0
        ? precos.map((row) => ({ price: row.amount, currency: row.currency }))
        : [{ price: precoLegado.amount, currency: precoLegado.currency }]

    return (
        <div className="min-h-screen bg-muted/40">
            <JsonLd
                data={buildProductSchema({
                    name: list.name,
                    slug: list.slug,
                    description: list.description,
                    offers: ofertas,
                    isActive: list.isActive,
                    locale,
                })}
            />
            <JsonLd
                data={buildBreadcrumbSchema(
                    buildListBreadcrumbTrail({
                        catalogLabel: t("breadcrumbCatalog"),
                        listName: list.name,
                        slug: list.slug,
                        locale,
                    })
                )}
            />
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 py-6">
                    <Link
                        href="/catalog"
                        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        {t("back")}
                    </Link>

                    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
                        <div>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                {list.isFeatured && (
                                    <Badge className="bg-brand text-brand-foreground hover:bg-brand">
                                        {t("featured")}
                                    </Badge>
                                )}
                                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                    {t("readyBadge")}
                                </span>
                            </div>
                            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                                {list.name}
                            </h1>
                            {list.description && (
                                <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                                    {list.description}
                                </p>
                            )}
                            {list.introduction && (
                                <div className="mt-6">
                                    <h2 className="text-lg font-semibold text-foreground">{t("introductionTitle")}</h2>
                                    <p className="mt-2 max-w-2xl whitespace-pre-line text-sm text-muted-foreground">
                                        {list.introduction}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="rounded-lg border bg-muted/40 p-4">
                            <div className="grid grid-cols-2 gap-3">
                                <QuickMetric label={t("quickCountries")} value={format.number(list.countries.length)} />
                                <QuickMetric label={t("quickLanguage")} value={<LanguageValue language={language} fallback={t("notInformed")} />} />
                                {dataReviewedAt && (
                                    <QuickMetric label={t("quickReviewed")} value={dataReviewedAt} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto grid gap-6 px-4 py-6 lg:grid-cols-[1fr_360px] lg:items-start">
                <div className="space-y-6">
                    <section className="rounded-lg border bg-card p-6">
                        <div className="mb-5 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">{t("coverageTitle")}</h2>
                                <p className="text-sm text-muted-foreground">{t("coverageSubtitle")}</p>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <DataItem label={t("fieldName")} value={list.name} icon={Building2} fallback={t("notInformed")} />
                            <DataItem label={t("fieldCountries")} value={list.countries.join(", ")} icon={Globe} fallback={t("notInformed")} />
                            <DataItem
                                label={t("fieldLanguage")}
                                value={<LanguageValue language={language} fallback={t("notInformed")} />}
                                icon={Globe}
                                fallback={t("notInformed")}
                            />
                            <DataItem
                                label={t("fieldIndustries")}
                                value={list.industries.map((id) => tCatalog(`industries.${id}`)).join(", ")}
                                icon={Target}
                                fallback={t("notInformed")}
                            />
                            {dataReviewedAt && (
                                <DataItem label={t("fieldReviewedAt")} value={dataReviewedAt} icon={BadgeCheck} fallback={t("notInformed")} />
                            )}
                            <DataItem label={t("fieldUpdatedAt")} value={updatedAt} icon={Calendar} fallback={t("notInformed")} />
                        </div>
                    </section>

                    {previewCount > 0 && (
                        <section className="rounded-lg border bg-card p-6">
                            <div className="mb-4 flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-foreground">{t("previewTitle")}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {t("previewSubtitle", { count: previewCount })}
                                </p>
                            </div>
                            <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-muted" />}>
                                <ListPreview previewData={list.previewData} locale={locale} />
                            </Suspense>
                        </section>
                    )}

                    <section className="rounded-lg border bg-card p-6">
                        <h2 className="mb-4 text-lg font-semibold text-foreground">{t("includedTitle")}</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <IncludedItem icon={Building2} text={t("includedCompany")} />
                            <IncludedItem icon={Globe} text={t("includedEmail")} />
                            <IncludedItem icon={Shield} text={t("includedPhone")} />
                            <IncludedItem icon={Target} text={t("includedLocation")} />
                            <IncludedItem icon={Users} text={t("includedIndustry")} />
                            <IncludedItem icon={FileText} text={t("includedFormats")} />
                        </div>
                    </section>
                </div>

                <aside className="lg:sticky lg:top-24">
                    <ListPriceBox
                        list={{
                            id: list.id,
                            name: list.name,
                            slug: list.slug,
                            totalLeads: list.totalLeads,
                        }}
                        precos={precos}
                        precoLegado={precoLegado}
                    />
                </aside>
            </div>
        </div>
    )
}

function QuickMetric({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="rounded-md bg-card p-3">
            <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
            <div className="mt-1 truncate text-sm font-semibold text-foreground">{value}</div>
        </div>
    )
}

function DataItem({
    label,
    value,
    icon: Icon,
    fallback,
}: {
    label: string
    value: ReactNode
    icon: ComponentType<{ className?: string }>
    fallback: string
}) {
    return (
        <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-card text-muted-foreground">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 truncate font-semibold text-foreground">{value || fallback}</div>
            </div>
        </div>
    )
}

function LanguageValue({
    language,
    fallback,
}: {
    language: ReturnType<typeof getListLanguage>
    fallback: string
}) {
    if (!language) return <>{fallback}</>
    return (
        <span className="flex items-center gap-1.5">
            <FlagIcon code={language.flagCode} size="sm" decorative />
            {language.label}
        </span>
    )
}

function IncludedItem({
    icon: Icon,
    text,
}: {
    icon: ComponentType<{ className?: string }>
    text: string
}) {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4 shrink-0 text-brand-accent-strong" />
            {text}
        </div>
    )
}

