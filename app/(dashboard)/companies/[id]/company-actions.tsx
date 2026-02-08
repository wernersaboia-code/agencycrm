// app/(dashboard)/companies/[id]/company-actions.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
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

import { CompanyModal } from "@/components/companies/company-modal"
import { deleteCompany } from "@/actions/companies"

type Company = {
    id: string
    name: string
    domain?: string | null
    industry?: string | null
    size?: string | null
    website?: string | null
    description?: string | null
    _count: {
        contacts: number
        deals: number
    }
}

type CompanyActionsProps = {
    company: Company
}

export function CompanyActions({ company }: CompanyActionsProps) {
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)

        const result = await deleteCompany(company.id)

        if (result.success) {
            toast.success("Empresa excluída com sucesso!")
            router.push("/companies")
        } else {
            toast.error(result.error || "Erro ao excluir empresa")
            setIsDeleting(false)
        }

        setIsDeleteOpen(false)
    }

    const handleEditSuccess = () => {
        router.refresh()
    }

    return (
        <>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                </Button>
                <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setIsDeleteOpen(true)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                </Button>
            </div>

            {/* Modal de edição */}
            <CompanyModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                company={company}
                onSuccess={handleEditSuccess}
            />

            {/* Dialog de confirmação */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir a empresa{" "}
                            <strong>{company.name}</strong>? Esta ação não pode ser desfeita.
                            {company._count.contacts > 0 && (
                                <span className="block mt-2 text-destructive">
                  ⚠️ Esta empresa possui {company._count.contacts} contato(s) vinculado(s).
                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}