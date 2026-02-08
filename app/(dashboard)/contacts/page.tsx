// app/(dashboard)/contacts/page.tsx

import { Suspense } from "react"
import { getContacts } from "@/actions/contacts"
import { ContactsClient } from "./contacts-client"

interface ContactsPageProps {
    searchParams: Promise<{ search?: string }>
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
    const params = await searchParams
    const { data: contacts, error } = await getContacts(params.search)

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Erro ao carregar contatos.</p>
            </div>
        )
    }

    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <ContactsClient contacts={contacts || []} />
        </Suspense>
    )
}