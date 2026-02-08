// app/(dashboard)/leads/import/page.tsx

import { Metadata } from "next"
import { CSVImportWizard } from "@/components/leads/import/csv-import-wizard"

export const metadata: Metadata = {
    title: "Importar Leads | AgencyCRM",
    description: "Importe leads de um arquivo CSV",
}

export default function ImportLeadsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <CSVImportWizard />
        </div>
    )
}