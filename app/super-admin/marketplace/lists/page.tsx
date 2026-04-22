// app/super-admin/marketplace/lists/page.tsx.bak
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, Users, Edit } from "lucide-react"
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