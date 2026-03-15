// app/super-admin/users/page.tsx

import { Suspense } from "react"
import Link from "next/link"
import { Users, Search, Filter } from "lucide-react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getUsers } from "@/actions/admin/users"
import { UserRoleSelect } from "@/components/admin/user-role-select"
import { UserStatusToggle } from "@/components/admin/user-status-toggle"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface UsersPageProps {
    searchParams: Promise<{
        search?: string
        role?: string
        status?: string
        page?: string
    }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
    const params = await searchParams

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
                <p className="text-muted-foreground">
                    Gerencie todos os usuários do sistema
                </p>
            </div>

            {/* Filtros */}
            <Card>
                <CardContent className="pt-6">
                    <form className="flex flex-wrap gap-4">
                        {/* Busca */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    name="search"
                                    placeholder="Buscar por nome ou email..."
                                    defaultValue={params.search}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Filtro Role */}
                        <Select name="role" defaultValue={params.role || "ALL"}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas Roles</SelectItem>
                                <SelectItem value="USER">User</SelectItem>
                                <SelectItem value="MANAGER">Manager</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Filtro Status */}
                        <Select name="status" defaultValue={params.status || "ALL"}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos Status</SelectItem>
                                <SelectItem value="ACTIVE">Ativo</SelectItem>
                                <SelectItem value="INACTIVE">Inativo</SelectItem>
                                <SelectItem value="PENDING">Pendente</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button type="submit">
                            <Filter className="h-4 w-4 mr-2" />
                            Filtrar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Tabela */}
            <Suspense fallback={<UsersTableSkeleton />}>
                <UsersTable
                    search={params.search}
                    role={params.role as any}
                    status={params.status as any}
                    page={params.page ? parseInt(params.page) : 1}
                />
            </Suspense>
        </div>
    )
}

// Componente da tabela
async function UsersTable({
                              search,
                              role,
                              status,
                              page,
                          }: {
    search?: string
    role?: string
    status?: string
    page: number
}) {
    const { users, total, pages, currentPage } = await getUsers({
        search,
        role: role as any,
        status: status as any,
        page,
    })

    if (users.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
                    <p className="text-muted-foreground">
                        {search ? "Tente ajustar os filtros de busca" : "Ainda não há usuários cadastrados"}
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Usuários ({total})</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-center">Workspaces</TableHead>
                            <TableHead>Cadastro</TableHead>
                            <TableHead>Último Acesso</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => {
                            const initials = user.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) || user.email[0].toUpperCase()

                            return (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">
                                                    {user.name || "Sem nome"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <UserRoleSelect
                                            userId={user.id}
                                            currentRole={user.role}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <UserStatusToggle
                                            userId={user.id}
                                            currentStatus={user.status}
                                        />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">
                                            {user._count.workspaces}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(user.createdAt), {
                                                addSuffix: true,
                                                locale: ptBR,
                                            })}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {user.lastLoginAt
                                                ? formatDistanceToNow(new Date(user.lastLoginAt), {
                                                    addSuffix: true,
                                                    locale: ptBR,
                                                })
                                                : "Nunca"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/super-admin/users/${user.id}`}>
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
                                    <Link
                                        href={`/super-admin/users?page=${currentPage - 1}${search ? `&search=${search}` : ""}${role ? `&role=${role}` : ""}${status ? `&status=${status}` : ""}`}
                                    >
                                        Anterior
                                    </Link>
                                </Button>
                            )}
                            {currentPage < pages && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link
                                        href={`/super-admin/users?page=${currentPage + 1}${search ? `&search=${search}` : ""}${role ? `&role=${role}` : ""}${status ? `&status=${status}` : ""}`}
                                    >
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

// Skeleton
function UsersTableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-8 w-24" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}