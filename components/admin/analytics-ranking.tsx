"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { VercelAnalyticsRow } from "@/lib/analytics/vercel-web-analytics"

type AnalyticsRankingLabels = {
    viewAll: string
    dialogTitle: string
    dialogDescription: string
}

function RankingRows({ rows, total }: { rows: VercelAnalyticsRow[]; total: number }) {
    return (
        <div className="space-y-3">
            {rows.map((row) => {
                const percentage = total > 0 ? (row.pageviews / total) * 100 : 0
                return (
                    <div key={row.label} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="min-w-0 truncate" title={row.label}>{row.label}</span>
                            <span className="shrink-0 text-right tabular-nums"><strong>{percentage.toFixed(1)}%</strong><span className="ml-2 text-muted-foreground">{row.pageviews.toLocaleString()} / {row.visitors.toLocaleString()}</span></span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-admin" style={{ width: `${Math.min(100, percentage)}%` }} /></div>
                    </div>
                )
            })}
        </div>
    )
}

export function AnalyticsRanking({ title, rows, total, labels }: { title: string; rows: VercelAnalyticsRow[]; total: number; labels: AnalyticsRankingLabels }) {
    const preview = rows.slice(0, 6)
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-base">{title}</CardTitle>
                {rows.length > preview.length && (
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm">{labels.viewAll}</Button></DialogTrigger>
                        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                            <DialogHeader><DialogTitle>{labels.dialogTitle}</DialogTitle><DialogDescription>{labels.dialogDescription}</DialogDescription></DialogHeader>
                            <RankingRows rows={rows} total={total} />
                        </DialogContent>
                    </Dialog>
                )}
            </CardHeader>
            <CardContent><RankingRows rows={preview} total={total} /></CardContent>
        </Card>
    )
}
