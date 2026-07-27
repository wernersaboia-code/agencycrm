// app/(crm)/settings/components/send-window-settings.tsx
"use client"

import { useState, useTransition } from "react"
import { Clock } from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    updateSendWindowSettings,
    updateReplyDetectionSettings,
    type SendWindowSettingsData,
    type ReplyDetectionSettingsData,
} from "@/actions/workspace-settings"
import {
    CRON_SEND_HOUR_UTC,
    describeCronHourIn,
} from "@/lib/campaigns/send-window"

// Fusos oferecidos na UI. Lista curta e explícita — cobre operação BR e público
// europeu, que é o caso real do produto.
const TIMEZONES = [
    { value: "UTC", label: "UTC" },
    { value: "America/Sao_Paulo", label: "Brasília (America/Sao_Paulo)" },
    { value: "Europe/Lisbon", label: "Lisboa (Europe/Lisbon)" },
    { value: "Europe/Berlin", label: "Berlim (Europe/Berlin)" },
    { value: "Europe/Madrid", label: "Madri (Europe/Madrid)" },
    { value: "Europe/London", label: "Londres (Europe/London)" },
    { value: "America/New_York", label: "Nova York (America/New_York)" },
]

const WEEKDAYS = [
    { value: 1, label: "Seg" },
    { value: 2, label: "Ter" },
    { value: 3, label: "Qua" },
    { value: 4, label: "Qui" },
    { value: 5, label: "Sex" },
    { value: 6, label: "Sáb" },
    { value: 7, label: "Dom" },
]

interface SendWindowSettingsProps {
    workspaceId: string
    initial: SendWindowSettingsData
    replyDetection: ReplyDetectionSettingsData | null
}

export function SendWindowSettings({ workspaceId, initial, replyDetection }: SendWindowSettingsProps) {
    const [form, setForm] = useState<SendWindowSettingsData>(initial)
    const [reply, setReply] = useState<ReplyDetectionSettingsData>(
        replyDetection ?? { replyDetectionEnabled: false, imapHost: null, imapPort: null }
    )
    const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(
        null
    )
    const [isPending, startTransition] = useTransition()

    // Um input numérico esvaziado (backspace até o fim) chega aqui como
    // event.target.value === "" — Number("") é 0, o que empurraria o campo
    // para um valor fora da faixa (ex.: sendEndHour: 0) sem o usuário ter
    // digitado isso. Mantém o valor anterior em vez de zerar.
    function parseNumberInput(value: string, previous: number): number {
        return value === "" ? previous : Number(value)
    }

    function toggleDay(day: number) {
        setForm((current) => ({
            ...current,
            sendDays: current.sendDays.includes(day)
                ? current.sendDays.filter((value) => value !== day)
                : [...current.sendDays, day].sort((a, b) => a - b),
        }))
    }

    function handleSave() {
        setMessage(null)
        startTransition(async () => {
            const windowResult = await updateSendWindowSettings(workspaceId, form)
            if (!windowResult.success) {
                setMessage({ type: "error", text: windowResult.error || "Erro ao salvar." })
                return
            }
            const replyResult = await updateReplyDetectionSettings(workspaceId, reply)
            setMessage(
                replyResult.success
                    ? { type: "ok", text: "Janela de envio salva." }
                    : { type: "error", text: replyResult.error || "Erro ao salvar." }
            )
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Janela de envio
                </CardTitle>
                <CardDescription>
                    Define quando as campanhas de e-mail podem sair. Envios fora da
                    janela são adiados para o próximo horário válido.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                    Os envios são processados <strong>uma vez por dia</strong>, às{" "}
                    {CRON_SEND_HOUR_UTC}h UTC ({describeCronHourIn(form.sendTimezone)} no
                    fuso selecionado). A janela precisa incluir esse horário — se não
                    incluir, nenhum e-mail é enviado.
                </p>
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="sendWindowEnabled">Respeitar a janela</Label>
                        <p className="text-sm text-muted-foreground">
                            Desligado, os e-mails saem a qualquer hora.
                        </p>
                    </div>
                    <Switch
                        id="sendWindowEnabled"
                        checked={form.sendWindowEnabled}
                        onCheckedChange={(checked) =>
                            setForm((current) => ({
                                ...current,
                                sendWindowEnabled: checked,
                            }))
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="sendTimezone">Fuso horário</Label>
                    <Select
                        value={form.sendTimezone}
                        onValueChange={(value) =>
                            setForm((current) => ({ ...current, sendTimezone: value }))
                        }
                    >
                        <SelectTrigger id="sendTimezone">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TIMEZONES.map((timezone) => (
                                <SelectItem key={timezone.value} value={timezone.value}>
                                    {timezone.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Dias de envio</Label>
                    <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map((day) => (
                            <Button
                                key={day.value}
                                type="button"
                                variant={
                                    form.sendDays.includes(day.value)
                                        ? "default"
                                        : "outline"
                                }
                                size="sm"
                                onClick={() => toggleDay(day.value)}
                            >
                                {day.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="sendStartHour">Hora inicial</Label>
                        <Input
                            id="sendStartHour"
                            type="number"
                            min={0}
                            max={23}
                            value={form.sendStartHour}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    sendStartHour: parseNumberInput(
                                        event.target.value,
                                        current.sendStartHour
                                    ),
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sendEndHour">Hora final</Label>
                        <Input
                            id="sendEndHour"
                            type="number"
                            min={1}
                            max={24}
                            value={form.sendEndHour}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    sendEndHour: parseNumberInput(
                                        event.target.value,
                                        current.sendEndHour
                                    ),
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sendJitterMinutes">Variação (min)</Label>
                        <Input
                            id="sendJitterMinutes"
                            type="number"
                            min={0}
                            max={120}
                            value={form.sendJitterMinutes}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    sendJitterMinutes: parseNumberInput(
                                        event.target.value,
                                        current.sendJitterMinutes
                                    ),
                                }))
                            }
                        />
                    </div>
                </div>

                {message && (
                    <p
                        className={
                            message.type === "ok"
                                ? "text-sm text-emerald-600"
                                : "text-sm text-destructive"
                        }
                    >
                        {message.text}
                    </p>
                )}

                <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar janela de envio"}
                </Button>

                <div className="space-y-4 border-t pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="replyDetectionEnabled">
                                Detectar respostas
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Lê a caixa de entrada por IMAP (mesma senha do SMTP) e
                                para a sequência de quem respondeu.
                            </p>
                        </div>
                        <Switch
                            id="replyDetectionEnabled"
                            checked={reply.replyDetectionEnabled}
                            onCheckedChange={(checked) =>
                                setReply((current) => ({
                                    ...current,
                                    replyDetectionEnabled: checked,
                                }))
                            }
                        />
                    </div>

                    {reply.replyDetectionEnabled && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="imapHost">
                                    Servidor IMAP (opcional)
                                </Label>
                                <Input
                                    id="imapHost"
                                    placeholder="imap.gmail.com"
                                    value={reply.imapHost ?? ""}
                                    onChange={(event) =>
                                        setReply((current) => ({
                                            ...current,
                                            imapHost: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imapPort">Porta (opcional)</Label>
                                <Input
                                    id="imapPort"
                                    type="number"
                                    placeholder="993"
                                    value={reply.imapPort ?? ""}
                                    onChange={(event) =>
                                        setReply((current) => ({
                                            ...current,
                                            imapPort: event.target.value
                                                ? Number(event.target.value)
                                                : null,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
