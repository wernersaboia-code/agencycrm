// app/super-admin/marketplace/lists/page.tsx.bak
import Link from "next/link"
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
import { AlertCircle, CheckCircle2, Edit, Plus, Star, Users } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { DeleteListButton } from "@/components/admin/delete-list-button"

export default async function MarketplaceListsPage() {
    const lists = await prisma.leadList.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: {
                    leads: true,
                    purchaseItems: true,
                },
            },
        },
    })
    const activeLists = lists.filter((list) => list.isActive).length
    const emptyLists = lists.filter((list) => list._count.leads === 0).length
    const featuredLists = lists.filter((list) => list.isFeatured).length
    const listsWithSales = lists.filter((list) => list._count.purchaseItems > 0).length
    const totalLeads = lists.reduce((acc, list) => acc + list._count.leads, 0)
    const totalSales = lists.reduce((acc, list) => acc + list._count.purchaseItems, 0)
    const readinessChecks = [
        {
            label: "Ativas",
            value: activeLists,
            description: "Listas disponíveis no catálogo.",
            done: activeLists > 0,
            icon: CheckCircle2,
        },
        {
            label: "Vazias",
            value: emptyLists,
            description: "Listas sem leads publicados.",
            done: emptyLists === 0 && lists.length > 0,
            icon: AlertCircle,
        },
        {
            label: "Destaques",
            value: featuredLists,
            description: "Listas promovidas no catálogo.",
            done: featuredLists > 0,
            icon: Star,
        },
        {
            label: "Com vendas",
            value: listsWithSales,
            description: `${totalSales} venda${totalSales !== 1 ? "s" : ""} no total.`,
            done: listsWithSales > 0,
            icon: Users,
        },
    ]
    const completedReadiness = readinessChecks.filter((check) => check.done).length
    const readiness = lists.length > 0
        ? Math.round((completedReadiness / readinessChecks.length) * 100)
        : 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Listas de Leads</h1>
                    <p className="text-muted-foreground">
                        Gerencie as listas disponíveis no marketplace
                    </p>
                </div>
                <Link href="/super-admin/marketplace/lists/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Lista
                    </Button>
                </Link>
            </div>

            <Card className={readiness >= 75 ? "border-emerald-300 dark:border-emerald-900" : "border-amber-300 dark:border-amber-900"}>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <CardTitle>Saúde do catálogo</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {lists.length} lista{lists.length !== 1 ? "s" : ""}, {totalLeads.toLocaleString()} lead{totalLeads !== 1 ? "s" : ""} publicados.
                        </p>
                    </div>
                    <div className="w-full space-y-2 lg:w-64">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Prontidão</span>
                            <span className="font-medium">{readiness}%</span>
                        </div>
                        <Progress value={readiness} />
                    </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-4">
                    {readinessChecks.map((check) => (
                        <div key={check.label} className="flex min-h-[96px] items-start justify-between gap-3 rounded-lg border bg-background p-4">
                            <span className="flex min-w-0 gap-3">
                                {check.done ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                ) : (
                                    <check.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                                )}
                                <span>
                                    <span className="block font-medium">{check.label}</span>
                                    <span className="block text-sm text-muted-foreground">{check.description}</span>
                                </span>
                            </span>
                            <span className="text-xl font-semibold">{check.value}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Países</TableHead>
                            <TableHead className="text-center">Leads</TableHead>
                            <TableHead className="text-center">Vendas</TableHead>
                            <TableHead className="text-right">Preço</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lists.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12">
                                    <p className="text-muted-foreground mb-4">
                                        Nenhuma lista criada ainda.
                                    </p>
                                    <Link href="/super-admin/marketplace/lists/new">
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Criar Primeira Lista
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ) : (
                            lists.map((list) => (
                                <TableRow key={list.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{list.name}</p>
                                            <p className="text-xs text-muted-foreground">{list.slug}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{list.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">
                                            {list.countries.slice(0, 3).join(", ")}
                                            {list.countries.length > 3 && ` +${list.countries.length - 3}`}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {list._count.leads.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {list._count.purchaseItems}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(Number(list.price), list.currency)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={list.isActive ? "default" : "secondary"}>
                                            {list.isActive ? "Ativa" : "Inativa"}
                                        </Badge>
                                        {list.isFeatured && (
                                            <Badge variant="outline" className="ml-1">
                                                Destaque
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Link href={`/super-admin/marketplace/lists/${list.id}/leads`}>
                                                <Button variant="ghost" size="icon" title="Ver Leads">
                                                    <Users className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/super-admin/marketplace/lists/${list.id}`}>
                                                <Button variant="ghost" size="icon" title="Editar">
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
