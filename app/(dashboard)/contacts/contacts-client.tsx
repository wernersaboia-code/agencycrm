// app/(dashboard)/contacts/contacts-client.tsx

"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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

import { ContactModal } from "@/components/contacts/contact-modal"
import { ContactWithRelations } from "@/types/contact"
import { deleteContact } from "@/actions/contacts"

interface ContactsClientProps {
    contacts: ContactWithRelations[]
}

const statusColors: Record<string, string> = {
    LEAD: "bg-blue-100 text-blue-800",
    ACTIVE: "bg-green-100 text-green-800",
    CUSTOMER: "bg-purple-100 text-purple-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    CHURNED: "bg-red-100 text-red-800",
}

const statusLabels: Record<string, string> = {
    LEAD: "Lead",
    ACTIVE: "Ativo",
    CUSTOMER: "Cliente",
    INACTIVE: "Inativo",
    CHURNED: "Perdido",
}

export function ContactsClient({ contacts }: ContactsClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [search, setSearch] = useState(searchParams.get("search") || "")
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedContact, setSelectedContact] = useState<ContactWithRelations | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [contactToDelete, setContactToDelete] = useState<string | null>(null)

    function handleSearch(e: React.FormEvent) {
        e.preventDefault()
        const params = new URLSearchParams()
        if (search) params.set("search", search)
        router.push(`/contacts?${params.toString()}`)
    }

    function handleNewContact() {
        setSelectedContact(null)
        setModalOpen(true)
    }

    function handleEditContact(contact: ContactWithRelations) {
        setSelectedContact(contact)
        setModalOpen(true)
    }

    function handleDeleteClick(id: string) {
        setContactToDelete(id)
        setDeleteDialogOpen(true)
    }

    async function handleDeleteConfirm() {
        if (!contactToDelete) return

        const result = await deleteContact(contactToDelete)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Contato excluído com sucesso!")
            router.refresh()
        }

        setDeleteDialogOpen(false)
        setContactToDelete(null)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Contatos</h1>
                    <p className="text-muted-foreground">
                        Gerencie seus contatos e leads
                    </p>
                </div>
                <Button onClick={handleNewContact}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo contato
                </Button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar contatos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button type="submit" variant="secondary">
                    Buscar
                </Button>
            </form>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Nenhum contato encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            contacts.map((contact) => (
                                <TableRow key={contact.id}>
                                    <TableCell className="font-medium">
                                        {contact.firstName} {contact.lastName}
                                    </TableCell>
                                    <TableCell>{contact.email || "-"}</TableCell>
                                    <TableCell>{contact.phone || contact.mobile || "-"}</TableCell>
                                    <TableCell>{contact.company?.name || "-"}</TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[contact.status]}>
                                            {statusLabels[contact.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => router.push(`/contacts/${contact.id}`)}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Ver detalhes
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDeleteClick(contact.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Contact Modal */}
            <ContactModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                contact={selectedContact}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O contato será removido permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}