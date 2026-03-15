// app/super-admin/marketplace/lists/new/page.tsx
import { ListForm } from "@/components/admin/list-form"

export default function NewListPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Nova Lista</h1>
                <p className="text-muted-foreground">
                    Crie uma nova lista de leads para o catálogo
                </p>
            </div>

            <ListForm />
        </div>
    )
}