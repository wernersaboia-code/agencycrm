"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { VercelAnalyticsRow } from "@/lib/analytics/vercel-web-analytics"

function countryFlag(code: string) {
    if (!/^[A-Z]{2}$/.test(code)) return "🌐"
    return String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0)))
}

function countryName(code: string, locale: string) {
    try {
        return new Intl.DisplayNames([locale], { type: "region" }).of(code) || code
    } catch {
        return code
    }
}

function CountryRows({ rows, total, locale }: { rows: VercelAnalyticsRow[]; total: number; locale: string }) {
    return (
        <div className="space-y-3">
            {rows.map((row) => {
                const percentage = total > 0 ? (row.pageviews / total) * 100 : 0
                return (
                    <div key={row.label} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="min-w-0 truncate"><span className="mr-2 text-lg">{countryFlag(row.label)}</span>{countryName(row.label, locale)}</span>
                            <span className="shrink-0 text-right tabular-nums"><strong>{percentage.toFixed(1)}%</strong><span className="ml-2 text-muted-foreground">{row.pageviews.toLocaleString()} / {row.visitors.toLocaleString()}</span></span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-admin" style={{ width: `${Math.min(100, percentage)}%` }} /></div>
                    </div>
                )
            })}
        </div>
    )
}

type CountryAnalyticsLabels = {
    title: string
    viewAll: (count: number) => string
    dialogTitle: string
    dialogDescription: string
}

export function CountryAnalytics({ rows, total, locale, labels }: { rows: VercelAnalyticsRow[]; total: number; locale: string; labels: CountryAnalyticsLabels }) {
    const preview = rows.slice(0, 6)
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-base">{labels.title}</CardTitle>
                {rows.length > preview.length && (
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm">{labels.viewAll(rows.length)}</Button></DialogTrigger>
                        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                            <DialogHeader><DialogTitle>{labels.dialogTitle}</DialogTitle><DialogDescription>{labels.dialogDescription}</DialogDescription></DialogHeader>
                            <CountryRows rows={rows} total={total} locale={locale} />
                        </DialogContent>
                    </Dialog>
                )}
            </CardHeader>
            <CardContent><CountryRows rows={preview} total={total} locale={locale} /></CardContent>
        </Card>
    )
}
