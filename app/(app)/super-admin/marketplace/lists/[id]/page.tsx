// app/super-admin/marketplace/lists/[id]/page.tsx.bak
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { ListForm } from "@/components/admin/list-form"

interface EditListPageProps {
    params: Promise<{ id: string }>
}

export default async function EditListPage({ params }: EditListPageProps) {
    const { id } = await params

    const list = await prisma.leadList.findUnique({
        where: { id },
        include: { prices: { select: { currency: true, amount: true } } },
    })

    if (!list) {
        notFound()
    }

    const t = await getTranslations("admin.listDetails")

    // O form edita um campo por moeda; o banco guarda uma linha por moeda.
    const prices: Record<string, number> = {}
    for (const row of list.prices) {
        prices[row.currency] = Number(row.amount)
    }

    // Serializar para passar ao Client Component
    const serializedList = {
        ...list,
        prices,
        price: Number(list.price),
        createdAt: list.createdAt.toISOString(),
        updatedAt: list.updatedAt.toISOString(),
        dataReviewedAt: list.dataReviewedAt?.toISOString() ?? null,
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t("editTitle")}</h1>
                <p className="text-muted-foreground">
                    {list.name}
                </p>
            </div>

            <ListForm list={serializedList} />
        </div>
    )
}