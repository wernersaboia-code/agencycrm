import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { getAuditLogs } from "@/actions/admin/audit"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 50

export default async function AuditPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>
}) {
    const t = await getTranslations("admin.audit")
    const tc = await getTranslations("admin.common")

    const { page } = await searchParams
    const currentPage = Math.max(1, Number(page) || 1)
    const { items, total } = await getAuditLogs({ page: currentPage })

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">
                    {t("subtitle", { total })}
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t("recentEvents")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground">
                                    <th className="py-2">{t("colDate")}</th>
                                    <th>{t("colActor")}</th>
                                    <th>{t("colAction")}</th>
                                    <th>{t("colTarget")}</th>
                                    <th>{t("colIp")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row) => (
                                    <tr key={row.id} className="border-t">
                                        <td className="py-2 whitespace-nowrap">
                                            {new Date(row.createdAt).toLocaleString("pt-BR")}
                                        </td>
                                        <td className="whitespace-nowrap">{row.actorEmail}</td>
                                        <td className="whitespace-nowrap">{row.action}</td>
                                        <td className="whitespace-nowrap">
                                            {row.targetType}:{row.targetId}
                                        </td>
                                        <td className="whitespace-nowrap">{row.ip ?? "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {items.length === 0 && (
                        <p className="py-6 text-center text-muted-foreground">
                            {t("empty")}
                        </p>
                    )}
                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between text-sm">
                            <Link
                                href={`/super-admin/audit?page=${Math.max(1, currentPage - 1)}`}
                                className={
                                    currentPage <= 1
                                        ? "pointer-events-none text-muted-foreground/50"
                                        : "text-foreground hover:underline"
                                }
                            >
                                {t("previous")}
                            </Link>
                            <span className="text-muted-foreground">
                                {tc("pageXofY", { current: currentPage, total: totalPages })}
                            </span>
                            <Link
                                href={`/super-admin/audit?page=${Math.min(totalPages, currentPage + 1)}`}
                                className={
                                    currentPage >= totalPages
                                        ? "pointer-events-none text-muted-foreground/50"
                                        : "text-foreground hover:underline"
                                }
                            >
                                {t("next")}
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
