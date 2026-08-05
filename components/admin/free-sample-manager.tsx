// components/admin/free-sample-manager.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    toggleFreeSample,
    deleteFreeSample,
    deleteFreeSampleDownload,
    exportFreeSampleDownloadsCSV,
} from "@/actions/admin/free-sample"

interface Amostra { id: string; fileName: string; isActive: boolean; createdAt: string }
interface Download { id: string; email: string; locale: string; createdAt: string }

export function FreeSampleManager({
    amostras,
    downloads,
}: {
    amostras: Amostra[]
    downloads: Download[]
}) {
    const t = useTranslations("admin.freeSample")
    const router = useRouter()
    const [enviando, setEnviando] = useState(false)

    const enviarPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setEnviando(true)
        try {
            const body = new FormData()
            body.append("file", file)
            const res = await fetch("/api/admin/free-sample/pdf", { method: "POST", body })
            if (!res.ok) {
                const { error } = await res.json().catch(() => ({ error: null }))
                toast.error(error ?? t("uploadFailed"))
                return
            }
            toast.success(t("uploadOk"))
            router.refresh()
        } finally {
            setEnviando(false)
            // Sem isto, escolher o MESMO arquivo de novo não dispara `change`.
            e.target.value = ""
        }
    }

    const alternar = async (id: string, isActive: boolean) => {
        await toggleFreeSample(id, isActive)
        router.refresh()
    }

    const apagarAmostra = async (id: string) => {
        await deleteFreeSample(id)
        router.refresh()
    }

    const apagarDownload = async (id: string) => {
        await deleteFreeSampleDownload(id)
        router.refresh()
    }

    const exportar = async () => {
        const csv = await exportFreeSampleDownloadsCSV()
        // BOM para o Excel abrir acentuação em UTF-8 sem perguntar.
        const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `amostra-downloads-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        {t("uploadLabel")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Input type="file" accept="application/pdf" onChange={enviarPdf} disabled={enviando} />
                    {enviando && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("uploading")}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">{t("uploadHint")}</p>
                </CardContent>
            </Card>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("colFile")}</TableHead>
                            <TableHead>{t("colUploaded")}</TableHead>
                            <TableHead className="text-center">{t("colActive")}</TableHead>
                            <TableHead className="text-right" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {amostras.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                                    {t("empty")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            amostras.map((a) => (
                                <TableRow key={a.id}>
                                    <TableCell className="font-medium">{a.fileName}</TableCell>
                                    <TableCell>{new Date(a.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                                    <TableCell className="text-center">
                                        <Switch
                                            checked={a.isActive}
                                            onCheckedChange={(v) => alternar(a.id, v)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => apagarAmostra(a.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t("downloadsTitle")}</CardTitle>
                    {downloads.length > 0 && (
                        <Button variant="outline" size="sm" onClick={exportar}>
                            {t("exportCsv")}
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("colEmail")}</TableHead>
                                <TableHead>{t("colLocale")}</TableHead>
                                <TableHead>{t("colDate")}</TableHead>
                                <TableHead className="text-right" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {downloads.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                                        {t("downloadsEmpty")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                downloads.map((d) => (
                                    <TableRow key={d.id}>
                                        <TableCell>{d.email}</TableCell>
                                        <TableCell>{d.locale}</TableCell>
                                        <TableCell>{new Date(d.createdAt).toLocaleString("pt-BR")}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => apagarDownload(d.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
