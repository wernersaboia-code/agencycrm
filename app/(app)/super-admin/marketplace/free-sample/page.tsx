// app/(app)/super-admin/marketplace/free-sample/page.tsx
import Link from "next/link"
import { getAdminTranslations } from "@/lib/i18n/admin-locale"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { FreeSampleManager } from "@/components/admin/free-sample-manager"

export default async function FreeSamplePage() {
    const t = await getAdminTranslations("admin.freeSample")
    const tc = await getAdminTranslations("admin.common")

    // `take: 200` porque a tabela é para olhar, não para paginar: quem precisa
    // da lista inteira usa o CSV.
    const [amostras, downloads] = await Promise.all([
        prisma.freeSample.findMany({ orderBy: { createdAt: "desc" } }),
        prisma.freeSampleDownload.findMany({
            orderBy: { createdAt: "desc" },
            take: 200,
            select: { id: true, email: true, locale: true, createdAt: true },
        }),
    ])

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("subtitle")}</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/super-admin">
                        <ArrowLeft className="h-4 w-4" />
                        {tc("backToDashboard")}
                    </Link>
                </Button>
            </div>

            <FreeSampleManager
                amostras={amostras.map((a) => ({
                    id: a.id,
                    fileName: a.fileName,
                    isActive: a.isActive,
                    createdAt: a.createdAt.toISOString(),
                }))}
                downloads={downloads.map((d) => ({
                    id: d.id,
                    email: d.email,
                    locale: d.locale,
                    createdAt: d.createdAt.toISOString(),
                }))}
            />
        </div>
    )
}
