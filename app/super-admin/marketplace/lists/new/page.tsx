// app/super-admin/marketplace/lists/new/page.tsx.bak
import { ListForm } from "@/components/admin/list-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function NewListPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Criar nova lista</h1>
                    <p className="text-muted-foreground">
                        Crie uma nova lista de leads para o catálogo.
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/super-admin/marketplace/lists">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para listas
                    </Link>
                </Button>
            </div>

            <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-4 text-sm text-emerald-900">
                    Primeiro preencha os dados da lista. Depois importe os leads e publique a lista quando ela estiver pronta para venda.
                </CardContent>
            </Card>

            <ListForm />
        </div>
    )
}
