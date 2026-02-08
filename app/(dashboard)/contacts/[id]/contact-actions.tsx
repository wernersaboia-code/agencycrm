// app/(dashboard)/contacts/[id]/contact-actions.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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

interface ContactActionsProps {
    contact: ContactWithRelations
}

export function ContactActions({ contact }: ContactActionsProps) {
    const router = useRouter()
    const [modalOpen, setModalOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    async function handleDelete() {
        const result = await deleteContact(contact.id)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Contato excluído com sucesso!")
            router.push("/contacts")
        }

        setDeleteDialogOpen(false)
    }

    return (
        <>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setModalOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Edit Modal */}
            <ContactModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                contact={contact}
            />

            {/* Delete Confirmation */}
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
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}