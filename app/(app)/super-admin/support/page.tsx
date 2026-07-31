import Link from "next/link"
import { LifeBuoy, Mail, Settings, Users } from "lucide-react"
import { getAdminTranslations } from "@/lib/i18n/admin-locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export async function generateMetadata() {
    const t = await getAdminTranslations("admin.support")
    return {
        title: t("metaTitle"),
        description: t("metaDesc"),
    }
}

export default async function SuperAdminSupportPage() {
    const t = await getAdminTranslations("admin.support")

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">
                    {t("subtitle")}
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <SupportCard
                    title={t("usersCard")}
                    description={t("usersCardDesc")}
                    href="/super-admin/users"
                    icon={Users}
                    t={t}
                />
                <SupportCard
                    title={t("workspacesCard")}
                    description={t("workspacesCardDesc")}
                    href="/super-admin/workspaces"
                    icon={LifeBuoy}
                    t={t}
                />
                <SupportCard
                    title={t("configCard")}
                    description={t("configCardDesc")}
                    href="/super-admin/settings"
                    icon={Settings}
                    t={t}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        {t("recommendedFlow")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>{t("step1")}</p>
                    <p>{t("step2")}</p>
                    <p>{t("step3")}</p>
                </CardContent>
            </Card>
        </div>
    )
}

function SupportCard({
    title,
    description,
    href,
    icon: Icon,
    t,
}: {
    title: string
    description: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    t: Awaited<ReturnType<typeof getAdminTranslations>>
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{description}</p>
                <Button asChild className="w-full">
                    <Link href={href}>
                        {t("open")}
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}
