// app/super-admin/marketplace/lists/new/page.tsx.bak
import { ListForm } from "@/components/admin/list-form"
import Link from "next/link"
import { getAdminTranslations } from "@/lib/i18n/admin-locale"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default async function NewListPage() {
    const t = await getAdminTranslations("admin.newList")

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{t("title")}</h1>
                    <p className="text-muted-foreground">
                        {t("subtitle")}
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/super-admin/marketplace/lists">
                        <ArrowLeft className="h-4 w-4" />
                        {t("backToLists")}
                    </Link>
                </Button>
            </div>

            <Card className="border-admin-soft bg-admin-soft">
                <CardContent className="p-4 text-sm text-admin">
                    {t("infoCard")}
                </CardContent>
            </Card>

            <ListForm />
        </div>
    )
}
