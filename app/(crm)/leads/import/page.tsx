// app/(crm)/leads/import/page.tsx.bak

import { Metadata } from "next"
import Link from "next/link"
import { CSVImportWizard } from "@/components/leads/import/csv-import-wizard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, FileSpreadsheet, Mail, Users } from "lucide-react"

export const metadata: Metadata = {
    title: "Importar Leads | AgencyCRM",
    description: "Importe leads de um arquivo CSV",
}

export default function ImportLeadsPage() {
    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Button variant="ghost" size="sm" asChild className="mb-2 -ml-3">
                        <Link href="/leads">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar para leads
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Importar leads</h1>
                    <p className="mt-1 text-muted-foreground">
                        Traga uma planilha para dentro do CRM e revise os dados antes de salvar.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileSpreadsheet className="h-4 w-4" />
                            Arquivo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        CSV, TXT e Excel são aceitos. A primeira linha deve ter os nomes das colunas.
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users className="h-4 w-4" />
                            Campos mínimos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Nome e email são obrigatórios. Telefone, empresa e segmento melhoram filtros e ações.
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CheckCircle2 className="h-4 w-4" />
                            Próximo passo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Depois da importação, revise leads novos e prepare um template para iniciar campanhas.
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                <CSVImportWizard />

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-base">Após importar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/leads">
                                <Users className="mr-2 h-4 w-4" />
                                Revisar leads
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                            <Link href="/templates">
                                <Mail className="mr-2 h-4 w-4" />
                                Criar template
                            </Link>
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            O dashboard também vai destacar leads novos sem contato depois da importação.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
