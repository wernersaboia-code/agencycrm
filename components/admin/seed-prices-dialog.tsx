"use client"

import { useState } from "react"
import { toast } from "sonner"
import { seedPricesFromRate } from "@/actions/admin/list-prices-bulk"
import { roundCommercial } from "@/lib/marketplace/list-prices"
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
            toast.success(`${resultado.data.updated} lista(s) ganharam preço em ${currency}.`)
            setOpen(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha ao gerar preços.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Gerar preços</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gerar preços a partir de uma taxa</DialogTitle>
                    <DialogDescription>
                        A taxa serve só para semear: o valor gravado é fixo e editável depois.
                        Listas que já têm preço nessa moeda não são alteradas.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Moeda</Label>
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
                        <Label htmlFor="rate">Taxa (1 EUR = ?)</Label>
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
                            Exemplo: uma lista de € 45,00 fica em {currency === "BRL" ? "R$" : "US$"}{" "}
                            {exemplo},00
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isSaving || !(parsedRate > 0)}>
                        {isSaving ? "Gerando..." : "Gerar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
