// app/(dashboard)/leads/[id]/page.tsx

import { redirect } from "next/navigation"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Detalhes do Lead | AgencyCRM",
}

// Por enquanto, redireciona para a lista
// Depois implementamos a página completa de detalhes
export default function LeadDetailPage() {
    redirect("/leads")
}