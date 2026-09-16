"use client"

import { useState } from "react"
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
                const percentage = total > 0 ? (row.visitors / total) * 100 : 0
                return (
                    <div key={row.label} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="min-w-0 truncate" title={row.label}>{row.label}</span>
                            <span className="shrink-0 text-right tabular-nums"><strong>{percentage.toFixed(1)}%</strong><span className="ml-2 text-muted-foreground">{row.visitors.toLocaleString()} / {row.pageviews.toLocaleString()}</span></span>
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

type RankingDataset = {
    title: string
    rows: VercelAnalyticsRow[]
    labels: AnalyticsRankingLabels
}

export function AnalyticsTabbedRanking({ primary, secondary, total }: { primary: RankingDataset; secondary: RankingDataset; total: number }) {
    const [selected, setSelected] = useState<"primary" | "secondary">("primary")
    const active = selected === "primary" ? primary : secondary
    const preview = active.rows.slice(0, 6)

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div className="flex gap-4">
                    <button type="button" onClick={() => setSelected("primary")} className={`border-b-2 pb-2 text-sm font-medium ${selected === "primary" ? "border-admin text-foreground" : "border-transparent text-muted-foreground"}`}>{primary.title}</button>
                    <button type="button" onClick={() => setSelected("secondary")} className={`border-b-2 pb-2 text-sm font-medium ${selected === "secondary" ? "border-admin text-foreground" : "border-transparent text-muted-foreground"}`}>{secondary.title}</button>
                </div>
                {active.rows.length > preview.length && (
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm">{active.labels.viewAll}</Button></DialogTrigger>
                        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                            <DialogHeader><DialogTitle>{active.labels.dialogTitle}</DialogTitle><DialogDescription>{active.labels.dialogDescription}</DialogDescription></DialogHeader>
                            <RankingRows rows={active.rows} total={total} />
                        </DialogContent>
                    </Dialog>
                )}
            </CardHeader>
            <CardContent><RankingRows rows={preview} total={total} /></CardContent>
        </Card>
    )
}
