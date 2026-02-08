// components/contacts/contact-modal.tsx

"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { ContactForm } from "@/components/forms/contact-form"
import { ContactFormValues } from "@/lib/validations/contact"
import { ContactWithRelations } from "@/types/contact"
import { createContact, updateContact } from "@/actions/contacts"

interface ContactModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    contact?: ContactWithRelations | null
}

export function ContactModal({ open, onOpenChange, contact }: ContactModalProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(data: ContactFormValues) {
        setIsLoading(true)

        try {
            if (contact) {
                const result = await updateContact(contact.id, data)
                if (result.error) {
                    toast.error(result.error)
                    return
                }
                toast.success("Contato atualizado com sucesso!")
            } else {
                const result = await createContact(data)
                if (result.error) {
                    toast.error(result.error)
                    return
                }
                toast.success("Contato criado com sucesso!")
            }

            onOpenChange(false)
            router.refresh()
        } catch (error) {
            toast.error("Ocorreu um erro. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {contact ? "Editar contato" : "Novo contato"}
                    </DialogTitle>
                    <DialogDescription>
                        {contact
                            ? "Atualize as informações do contato."
                            : "Preencha as informações para criar um novo contato."}
                    </DialogDescription>
                </DialogHeader>

                <ContactForm
                    contact={contact}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    )
}