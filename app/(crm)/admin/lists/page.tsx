// app/(crm)/admin/lists/page.tsx
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
import { Plus, Pencil, Users, Eye, EyeOff } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default async function AdminListsPage() {
    const lists = await prisma.leadList.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { leads: true, purchaseItems: true }
            }
        }
    })

    // Serializar os dados antes de usar
    const serializedLists = lists.map(list => ({
        ...list,
        price: Number(list.price),
        createdAt: list.createdAt.toISOString(),
        updatedAt: list.updatedAt.toISOString(),
    }))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Listas de Leads</h1>
                    <p className="text-muted-foreground">
                        Gerencie as listas disponíveis no catálogo
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/lists/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Lista
                    </Link>
                </Button>
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
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    Nenhuma lista cadastrada ainda.
                                </TableCell>
                            </TableRow>
                        ) : (
                            lists.map((list) => (
                                <TableRow key={list.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{list.name}</p>
                                            <p className="text-sm text-muted-foreground">{list.slug}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{list.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {list.countries.slice(0, 3).join(", ")}
                                        {list.countries.length > 3 && ` +${list.countries.length - 3}`}
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
                                        {list.isActive ? (
                                            <Badge className="bg-green-100 text-green-800">
                                                <Eye className="h-3 w-3 mr-1" />
                                                Ativa
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                <EyeOff className="h-3 w-3 mr-1" />
                                                Inativa
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/lists/${list.id}/leads`}>
                                                    <Users className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/lists/${list.id}`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
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