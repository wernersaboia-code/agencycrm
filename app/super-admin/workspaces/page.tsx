// app/super-admin/workspaces/page.tsx

import { Suspense } from "react"
import Link from "next/link"
import { Building2, Search, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getWorkspaces } from "@/actions/admin/workspaces"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface WorkspacesPageProps {
    searchParams: Promise<{
        search?: string
        page?: string
    }>
}

export default async function WorkspacesPage({ searchParams }: WorkspacesPageProps) {
    const params = await searchParams

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Gestão de Workspaces</h1>
                <p className="text-muted-foreground">
                    Visualize e gerencie todos os workspaces do sistema
                </p>
            </div>

            {/* Filtros */}
            <Card>
                <CardContent className="pt-6">
                    <form className="flex gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    name="search"
                                    placeholder="Buscar por nome do workspace ou dono..."
                                    defaultValue={params.search}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Button type="submit">
                            <Filter className="h-4 w-4 mr-2" />
                            Buscar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Tabela */}
            <Suspense fallback={<WorkspacesTableSkeleton />}>
                <WorkspacesTable
                    search={params.search}
                    page={params.page ? parseInt(params.page) : 1}
                />
            </Suspense>
        </div>
    )
}

async function WorkspacesTable({
                                   search,
                                   page,
                               }: {
    search?: string
    page: number
}) {
    const { workspaces, total, pages, currentPage } = await getWorkspaces({
        search,
        page,
    })

    if (workspaces.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum workspace encontrado</h3>
                    <p className="text-muted-foreground">
                        {search ? "Tente ajustar a busca" : "Ainda não há workspaces cadastrados"}
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Workspaces ({total})</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Workspace</TableHead>
                            <TableHead>Dono</TableHead>
                            <TableHead className="text-center">Leads</TableHead>
                            <TableHead className="text-center">Campanhas</TableHead>
                            <TableHead className="text-center">Ligações</TableHead>
                            <TableHead className="text-center">Templates</TableHead>
                            <TableHead>Criado</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {workspaces.map((workspace) => {
                            const ownerInitials = workspace.user.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) || workspace.user.email[0].toUpperCase()

                            return (
                                <TableRow key={workspace.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                                style={{ backgroundColor: workspace.color }}
                                            >
                                                {workspace.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium">{workspace.name}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/super-admin/users/${workspace.user.id}`}
                                            className="flex items-center gap-2 hover:underline"
                                        >
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                                                    {ownerInitials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm">
                                                {workspace.user.name || workspace.user.email}
                                            </span>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">
                                            {workspace._count.leads.toLocaleString()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">
                                            {workspace._count.campaigns}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">
                                            {workspace._count.calls}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">
                                            {workspace._count.emailTemplates}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(workspace.createdAt), {
                                                addSuffix: true,
                                                locale: ptBR,
                                            })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/super-admin/workspaces/${workspace.id}`}>
                                                Ver detalhes
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>

                {/* Paginação */}
                {pages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                            Página {currentPage} de {pages}
                        </p>
                        <div className="flex gap-2">
                            {currentPage > 1 && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/super-admin/workspaces?page=${currentPage - 1}${search ? `&search=${search}` : ""}`}>
                                        Anterior
                                    </Link>
                                </Button>
                            )}
                            {currentPage < pages && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/super-admin/workspaces?page=${currentPage + 1}${search ? `&search=${search}` : ""}`}>
                                        Próxima
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function WorkspacesTableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}