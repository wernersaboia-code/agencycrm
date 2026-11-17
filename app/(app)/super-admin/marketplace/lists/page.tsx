// app/super-admin/marketplace/lists/page.tsx.bak
import Link from "next/link"
import { getAdminLocale, getAdminTranslations } from "@/lib/i18n/admin-locale"
import { getSetores } from "@/lib/marketplace/setores-servidor"
import { mapaDeNomes } from "@/lib/marketplace/setores"
import { calcularCobertura } from "@/lib/admin/cobertura"
import { VENDA_REAL } from "@/lib/admin/receita"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { AlertCircle, ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, CheckCircle2, Edit, FileText, Plus, Star, Users } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { DeleteListButton } from "@/components/admin/delete-list-button"
import { SeedPricesDialog } from "@/components/admin/seed-prices-dialog"
import { ListsFilterBar } from "@/components/admin/lists-filter-bar"
import {
    filtrarListas,
    lerOrdenacao,
    ordenarListas,
    temDescricaoForaDaRegra,
    temFiltroAtivo,
    type ColunaOrdenavel,
} from "@/lib/admin/filtro-listas"

interface MarketplaceListsPageProps {
    searchParams: Promise<{
        q?: string
        country?: string
        industry?: string
        status?: string
        sort?: string
        dir?: string
    }>
}

export default async function MarketplaceListsPage({ searchParams }: MarketplaceListsPageProps) {
    const filtros = await searchParams
    const lists = await prisma.leadList.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: {
                    leads: true,
                    // Compra de teste não conta como venda da lista.
                    purchaseItems: { where: { purchase: VENDA_REAL } },
                },
            },
        },
    })
    // Os cards de saúde contam o catálogo INTEIRO, nunca o filtrado. Se
    // "Sem PDF: 0" respondesse ao filtro, ele diria que está tudo certo
    // justamente quando o admin isolou um pedaço — é o número que ele usa
    // para decidir que não há mais nada a fazer.
    const activeLists = lists.filter((list) => list.isActive).length
    const listsWithoutPdf = lists.filter((list) => !list.studyPdfUrl).length
    const featuredLists = lists.filter((list) => list.isFeatured).length
    const listsWithBadDescription = lists.filter(temDescricaoForaDaRegra).length
    const cobertura = calcularCobertura(lists.filter((list) => list.isActive))
    const t = await getAdminTranslations("admin.lists")
    const tc = await getAdminTranslations("admin.common")
    const nomesDeSetor = mapaDeNomes(await getSetores(), await getAdminLocale())
    // Prontidão mede o que o admin pode resolver no cadastro. "Com vendas" saiu
    // em 14.11.2026: venda é resultado, não pendência, e com zero vendas reais
    // a barra ficava presa em 75% acusando um problema que nenhum ajuste no
    // catálogo resolve. As vendas por lista continuam na coluna da tabela.
    const readinessChecks = [
        {
            label: t("active"),
            value: activeLists,
            description: t("activeDesc"),
            done: activeLists > 0,
            icon: CheckCircle2,
        },
        {
            label: t("noPdf"),
            value: listsWithoutPdf,
            description: t("noPdfDesc"),
            done: listsWithoutPdf === 0 && lists.length > 0,
            icon: AlertCircle,
        },
        {
            label: t("badDescription"),
            value: listsWithBadDescription,
            description: t("badDescriptionDesc"),
            done: listsWithBadDescription === 0 && lists.length > 0,
            icon: FileText,
            // O número só ajuda se levar às listas: abre a tabela já filtrada.
            href: "/super-admin/marketplace/lists?status=badDescription",
        },
        {
            label: t("featured"),
            value: featuredLists,
            description: t("featuredDesc"),
            done: featuredLists > 0,
            icon: Star,
        },
    ]
    const completedReadiness = readinessChecks.filter((check) => check.done).length
    const readiness = lists.length > 0
        ? Math.round((completedReadiness / readinessChecks.length) * 100)
        : 0

    // Filtro em memória: a consulta já traz o catálogo todo para os cards de
    // saúde, então repetir a ida ao banco só para recortá-lo custa mais do que
    // percorrer as linhas aqui. Revisar quando o catálogo passar de algumas
    // centenas de listas.
    const ordenacao = lerOrdenacao(filtros.sort, filtros.dir)
    const listasFiltradas = ordenarListas(filtrarListas(lists, filtros), ordenacao)

    // Cabeçalho ordenável: link que mantém os filtros aplicados. Clicar de novo
    // na coluna ativa inverte a direção; numa coluna nova, começa no padrão dela.
    const cabecalho = (coluna: ColunaOrdenavel, rotulo: string, alinhamento: "left" | "center" | "right", dica?: string) => {
        const ativa = ordenacao?.coluna === coluna
        const params = new URLSearchParams()
        for (const chave of ["q", "country", "industry", "status"] as const) {
            if (filtros[chave]) params.set(chave, filtros[chave]!)
        }
        params.set("sort", coluna)
        if (ativa) params.set("dir", ordenacao.direcao === "asc" ? "desc" : "asc")
        const Icone = !ativa ? ArrowUpDown : ordenacao.direcao === "asc" ? ArrowUp : ArrowDown
        const justificar = { left: "justify-start", center: "justify-center", right: "justify-end" }[alinhamento]
        return (
            <TableHead
                className={alinhamento === "left" ? undefined : `text-${alinhamento}`}
                title={dica}
                aria-sort={ativa ? (ordenacao.direcao === "asc" ? "ascending" : "descending") : undefined}
            >
                <Link
                    href={`/super-admin/marketplace/lists?${params}`}
                    scroll={false}
                    className={`inline-flex w-full items-center gap-1 ${justificar} hover:text-foreground ${ativa ? "text-foreground" : ""}`}
                >
                    {rotulo}
                    <Icone className={`h-3.5 w-3.5 ${ativa ? "" : "opacity-40"}`} />
                </Link>
            </TableHead>
        )
    }
    const temFiltro = temFiltroAtivo(filtros)

    // As opções vêm do catálogo real: faceta sem lista por trás é filtro que
    // nunca devolve nada.
    const paisesDisponiveis = [...new Set(lists.flatMap((l) => l.countries))].sort()
    const setoresDisponiveis = [...new Set(lists.flatMap((l) => l.industries))].sort()

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t("title")}</h1>
                    <p className="text-muted-foreground">
                        {t("subtitle")}
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" asChild>
                        <Link href="/super-admin">
                            <ArrowLeft className="h-4 w-4" />
                            {tc("backToDashboard")}
                        </Link>
                    </Button>
                    <SeedPricesDialog />
                    <Button className="bg-admin hover:bg-admin" asChild>
                        <Link href="/super-admin/marketplace/lists/new">
                            <Plus className="h-4 w-4" />
                            {t("createNewList")}
                        </Link>
                    </Button>
                </div>
            </div>

            <Card className="border-admin-soft bg-admin-soft">
                <CardContent className="p-4 text-sm text-admin">
                    {t("infoCard")}
                </CardContent>
            </Card>

            <Card className={readiness >= 75 ? "border-admin dark:border-admin-soft" : "border-amber-300 dark:border-amber-900"}>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <CardTitle>{t("catalogHealth")}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t("healthDesc", { count: lists.length, countries: cobertura.paises })}
                        </p>
                    </div>
                    <div className="w-full space-y-2 lg:w-64">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t("readiness")}</span>
                            <span className="font-medium">{readiness}%</span>
                        </div>
                        <Progress value={readiness} />
                    </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {readinessChecks.map((check) => {
                        const conteudo = (
                            <>
                            <span className="flex min-w-0 gap-3">
                                {check.done ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-admin" />
                                ) : (
                                    <check.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                                )}
                                <span>
                                    <span className="block font-medium">{check.label}</span>
                                    <span className="block text-sm text-muted-foreground">{check.description}</span>
                                </span>
                            </span>
                            <span className="text-xl font-semibold">{check.value}</span>
                            </>
                        )
                        const classe = "flex min-h-[96px] items-start justify-between gap-3 rounded-lg border bg-background p-4"
                        return "href" in check && check.href && check.value > 0 ? (
                            <Link key={check.label} href={check.href} className={`${classe} transition-colors hover:border-admin`}>
                                {conteudo}
                            </Link>
                        ) : (
                            <div key={check.label} className={classe}>
                                {conteudo}
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            {lists.length > 0 && (
                <ListsFilterBar
                    countries={paisesDisponiveis}
                    industries={setoresDisponiveis}
                    nomesDeSetor={nomesDeSetor}
                    shown={listasFiltradas.length}
                    total={lists.length}
                />
            )}

            <div className="border rounded-lg">
                {/* A tabela tem de caber na largura: as células do componente
                    não quebram linha (whitespace-nowrap), então nome, slug e
                    países esticavam a tabela e a barra horizontal só aparecia
                    depois de 100+ linhas. Aqui as colunas de texto quebram. Não
                    limitar a altura: rolagem dentro da rolagem prende a roda do
                    mouse na tabela e dá o mesmo efeito. */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            {cabecalho("name", t("colName"), "left")}
                            <TableHead>{t("colIndustries")}</TableHead>
                            <TableHead>{t("colCountries")}</TableHead>
                            {cabecalho("companies", t("colCompanies"), "center", t("colCompaniesHint"))}
                            {cabecalho("sales", t("colSales"), "center")}
                            {cabecalho("price", t("colPrice"), "right")}
                            <TableHead className="text-center">{t("colStatus")}</TableHead>
                            <TableHead className="text-right">{t("colActions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {listasFiltradas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12">
                                    {/* Catálogo vazio e filtro sem resultado são
                                        problemas diferentes: no segundo, "criar a
                                        primeira lista" manda o admin criar uma
                                        lista que provavelmente já existe. */}
                                    <p className="text-muted-foreground mb-4">
                                        {temFiltro ? t("emptyFiltered") : t("emptyTitle")}
                                    </p>
                                    {!temFiltro && (
                                        <Link href="/super-admin/marketplace/lists/new">
                                            <Button>
                                                <Plus className="h-4 w-4 mr-2" />
                                                {t("createFirst")}
                                            </Button>
                                        </Link>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                            listasFiltradas.map((list) => (
                                <TableRow key={list.id}>
                                    <TableCell className="min-w-[10rem] whitespace-normal">
                                        <div>
                                            <p className="font-medium">{list.name}</p>
                                            <p className="text-xs text-muted-foreground break-all">{list.slug}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="min-w-[7rem] whitespace-normal">
                                        {/* O Badge não quebra linha por padrão, e "Produtos para Bebês e
                                            Crianças Pequenas" sozinho alargava a coluna em 260px. */}
                                        <div className="flex flex-wrap gap-1">
                                            {list.industries.map((id) => (
                                                <Badge key={id} variant="outline" className="whitespace-normal text-left">{nomesDeSetor[id] ?? id}</Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="min-w-[6rem] whitespace-normal">
                                        <span className="text-sm">
                                            {list.countries.slice(0, 3).join(", ")}
                                            {list.countries.length > 3 && ` +${list.countries.length - 3}`}
                                        </span>
                                    </TableCell>
                                    <TableCell
                                        className="text-center tabular-nums"
                                        title={list.companyCount == null
                                            ? undefined
                                            : list.companyCountManual ? t("companiesManual") : t("companiesEstimate")}
                                    >
                                        {/* "≈" marca estimativa lida do PDF; sem ele, conferido à mão. */}
                                        {list.companyCount == null
                                            ? <span className="text-muted-foreground">—</span>
                                            : `${list.companyCountManual ? "" : "≈ "}${list.companyCount}`}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {list._count.purchaseItems}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(Number(list.price), list.currency)}
                                    </TableCell>
                                    <TableCell className="whitespace-normal">
                                        <div className="flex flex-wrap justify-center gap-1">
                                            <Badge variant={list.isActive ? "default" : "secondary"}>
                                                {list.isActive ? t("badgeActive") : t("badgeInactive")}
                                            </Badge>
                                            {list.isFeatured && (
                                                <Badge variant="outline">
                                                    {t("badgeFeatured")}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {/* Em tela menor os 4 botões ficam 2×2 para a tabela caber. */}
                                        <div className="grid grid-cols-2 justify-items-end gap-1 2xl:flex 2xl:justify-end">
                                            {list.studyPdfUrl && (
                                                <a
                                                    href={`/api/admin/lists/${list.id}/pdf`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button variant="ghost" size="icon" title={t("openPdf")}>
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                </a>
                                            )}
                                            <Link href={`/super-admin/marketplace/lists/${list.id}/leads`}>
                                                <Button variant="ghost" size="icon" title={t("viewLeads")}>
                                                    <Users className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/super-admin/marketplace/lists/${list.id}`}>
                                                <Button variant="ghost" size="icon" title={t("edit")}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <DeleteListButton listId={list.id} listName={list.name} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
