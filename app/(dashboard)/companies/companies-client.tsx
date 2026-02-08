// app/(dashboard)/companies/companies-client.tsx

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Building2,
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
    Users,
    Globe,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

import { CompanyModal } from "@/components/companies/company-modal"
import { getCompanies, deleteCompany } from "@/actions/companies"

type Company = {
    id: string
    name: string
    domain?: string | null
    industry?: string | null
    size?: string | null
    website?: string | null
    description?: string | null
    createdAt: Date
    _count: {
        contacts: number
        deals: number
    }
}

type CompaniesClientProps = {
    initialCompanies: Company[]
}

export function CompaniesClient({ initialCompanies }: CompaniesClientProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const [companies, setCompanies] = useState<Company[]>(initialCompanies)
    const [search, setSearch] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
    const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)

    // Buscar empresas
    const handleSearch = (value: string) => {
        setSearch(value)
        startTransition(async () => {
            const result = await getCompanies(value)
            if (result.success) {
                setCompanies(result.data || [])
            }
        })
    }

    // Abrir modal para criar
    const handleCreate = () => {
        setSelectedCompany(null)
        setIsModalOpen(true)
    }

    // Abrir modal para editar
    const handleEdit = (company: Company) => {
        setSelectedCompany(company)
        setIsModalOpen(true)
    }

    // Confirmar exclusão
    const handleDeleteConfirm = async () => {
        if (!companyToDelete) return

        const result = await deleteCompany(companyToDelete.id)

        if (result.success) {
            toast.success("Empresa excluída com sucesso!")
            setCompanies(companies.filter((c) => c.id !== companyToDelete.id))
        } else {
            toast.error(result.error || "Erro ao excluir empresa")
        }

        setCompanyToDelete(null)
    }

    // Atualizar lista após sucesso
    const handleSuccess = () => {
        startTransition(async () => {
            const result = await getCompanies(search)
            if (result.success) {
                setCompanies(result.data || [])
            }
        })
    }

    // Ver detalhes
    const handleView = (company: Company) => {
        router.push(`/companies/${company.id}`)
    }

    // Helper para obter contagem de contatos de forma segura
    const getContactsCount = (company: Company | null): number => {
        return company?._count?.contacts ?? 0
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Lista de Empresas</CardTitle>
                            <CardDescription>
                                {companies.length} empresa{companies.length !== 1 ? "s" : ""} cadastrada{companies.length !== 1 ? "s" : ""}
                            </CardDescription>
                        </div>
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Empresa
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Barra de busca */}
                    <div className="mb-4">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar empresas..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Tabela */}
                    {companies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Building2 className="h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-lg font-semibold">
                                Nenhuma empresa encontrada
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {search
                                    ? "Tente uma busca diferente"
                                    : "Comece criando sua primeira empresa"}
                            </p>
                            {!search && (
                                <Button onClick={handleCreate} className="mt-4">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nova Empresa
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Empresa</TableHead>
                                        <TableHead>Indústria</TableHead>
                                        <TableHead>Tamanho</TableHead>
                                        <TableHead className="text-center">Contatos</TableHead>
                                        <TableHead className="text-center">Deals</TableHead>
                                        <TableHead className="w-[70px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {companies.map((company) => (
                                        <TableRow key={company.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{company.name}</span>
                                                    {company.domain && (
                                                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                                                            {company.domain}
                            </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {company.industry ? (
                                                    <Badge variant="secondary">{company.industry}</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {company.size || (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    {company._count.contacts}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {company._count.deals}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Ações</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleView(company)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Ver detalhes
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEdit(company)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setCompanyToDelete(company)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de criar/editar */}
            <CompanyModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                company={selectedCompany}
                onSuccess={handleSuccess}
            />

            {/* Dialog de confirmação de exclusão */}
            <AlertDialog
                open={!!companyToDelete}
                onOpenChange={(open) => !open && setCompanyToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir a empresa{" "}
                            <strong>{companyToDelete?.name}</strong>? Esta ação não pode ser
                            desfeita.
                            {getContactsCount(companyToDelete) > 0 && (
                                <span className="block mt-2 text-destructive">
                  ⚠️ Esta empresa possui {getContactsCount(companyToDelete)} contato(s) vinculado(s).
                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}