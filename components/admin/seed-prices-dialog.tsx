"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { seedPricesFromRate } from "@/actions/admin/list-prices-bulk"
import { roundCommercial } from "@/lib/marketplace/list-prices"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function SeedPricesDialog() {
    const t = useTranslations("admin.components.seedPrices")
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [currency, setCurrency] = useState<"BRL" | "USD">("BRL")
    const [rate, setRate] = useState("6.40")
    const [isSaving, setIsSaving] = useState(false)

    const parsedRate = Number(rate)
    // Exemplo vivo com um preço típico do catálogo (as listas vão de 20 a 70).
    const exemplo = parsedRate > 0 ? roundCommercial(45 * parsedRate, currency) : null

    async function handleSubmit() {
        setIsSaving(true)
        try {
            const resultado = await seedPricesFromRate(currency, parsedRate)
            if (!resultado.success) {
                toast.error(resultado.error)
                return
            }
            toast.success(t("success", { count: resultado.data.updated, currency }))
            setOpen(false)
            // A tabela de listas mostra os preços: sem isto ela seguia antiga.
            router.refresh()
        } catch {
            toast.error(t("error"))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">{t("trigger")}</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t("description")}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>{t("currency")}</Label>
                        <div className="flex gap-2">
                            {(["BRL", "USD"] as const).map((c) => (
                                <Button
                                    key={c}
                                    type="button"
                                    variant={currency === c ? "default" : "outline"}
                                    onClick={() => setCurrency(c)}
                                >
                                    {c}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="rate">{t("rate")}</Label>
                        <Input
                            id="rate"
                            type="number"
                            step="0.01"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                        />
                    </div>

                    {exemplo !== null && (
                        <p className="text-sm text-muted-foreground">
                            {t("example", {
                                from: formatCurrency(45, "EUR"),
                                to: formatCurrency(exemplo, currency),
                            })}
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isSaving || !(parsedRate > 0)}>
                        {isSaving ? t("generating") : t("generate")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
