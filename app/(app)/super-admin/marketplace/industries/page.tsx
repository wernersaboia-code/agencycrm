// app/(app)/super-admin/marketplace/industries/page.tsx
import { listarSetoresAdmin } from "@/actions/admin/industries"
import { IndustryManager } from "@/components/admin/industry-manager"
import { getAdminTranslations } from "@/lib/i18n/admin-locale"

export const dynamic = "force-dynamic"

export default async function IndustriesPage() {
    const [setores, t] = await Promise.all([
        listarSetoresAdmin(),
        getAdminTranslations("admin.industries"),
    ])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t("title")}</h1>
                <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>
            <IndustryManager setores={setores} />
        </div>
    )
}
