// app/(dashboard)/companies/page.tsx

import { Suspense } from "react"
import { Metadata } from "next"
import { Building2 } from "lucide-react"

import { getCompanies } from "@/actions/companies"
import { CompaniesClient } from "./companies-client"

export const metadata: Metadata = {
    title: "Empresas | NextCRM",
    description: "Gerencie suas empresas",
}

async function CompaniesData() {
    const result = await getCompanies()
    return <CompaniesClient initialCompanies={result.data || []} />
}

function CompaniesLoading() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Carregando empresas...</p>
            </div>
        </div>
    )
}

export default function CompaniesPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2">
                    <Building2 className="h-6 w-6" />
                    <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
                </div>
                <p className="text-muted-foreground mt-1">
                    Gerencie as empresas do seu CRM
                </p>
            </div>

            {/* Conteúdo */}
            <Suspense fallback={<CompaniesLoading />}>
                <CompaniesData />
            </Suspense>
        </div>
    )
}