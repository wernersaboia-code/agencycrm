// app/super-admin/marketplace/lists/[id]/page.tsx.bak
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ListForm } from "@/components/admin/list-form"

interface EditListPageProps {
    params: Promise<{ id: string }>
}

export default async function EditListPage({ params }: EditListPageProps) {
    const { id } = await params

    const list = await prisma.leadList.findUnique({
        where: { id },
    })

    if (!list) {
        notFound()
    }

    // Serializar para passar ao Client Component
    const serializedList = {
        ...list,
        price: Number(list.price),
        createdAt: list.createdAt.toISOString(),
        updatedAt: list.updatedAt.toISOString(),
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Editar Lista</h1>
                <p className="text-muted-foreground">
                    {list.name}
                </p>
            </div>

            <ListForm list={serializedList} />
        </div>
    )
}