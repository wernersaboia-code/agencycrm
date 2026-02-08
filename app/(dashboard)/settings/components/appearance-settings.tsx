// app/(dashboard)/settings/components/appearance-settings.tsx

"use client"

import { useTheme } from "next-themes"
import { Moon, Sun, Monitor } from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function AppearanceSettings() {
    const { theme, setTheme } = useTheme()

    const themes = [
        {
            value: "light",
            label: "Claro",
            icon: Sun,
            description: "Tema claro para ambientes iluminados",
        },
        {
            value: "dark",
            label: "Escuro",
            icon: Moon,
            description: "Tema escuro para reduzir o cansaço visual",
        },
        {
            value: "system",
            label: "Sistema",
            icon: Monitor,
            description: "Segue a preferência do seu sistema operacional",
        },
    ]

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Tema</CardTitle>
                    <CardDescription>
                        Escolha como o NextCRM deve aparecer para você
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {themes.map((t) => {
                            const Icon = t.icon
                            const isSelected = theme === t.value

                            return (
                                <button
                                    key={t.value}
                                    onClick={() => setTheme(t.value)}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all",
                                        "hover:border-primary/50 hover:bg-muted/50",
                                        isSelected
                                            ? "border-primary bg-primary/5"
                                            : "border-muted"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "p-3 rounded-full",
                                            isSelected
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                        )}
                                    >
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium">{t.label}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {t.description}
                                        </p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Preview do tema */}
            <Card>
                <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                        Veja como os elementos aparecem com o tema atual
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="p-4 rounded-lg border bg-card">
                            <h4 className="font-medium mb-2">Card</h4>
                            <p className="text-sm text-muted-foreground">
                                Este é um exemplo de texto em um card.
                            </p>
                        </div>

                        <div className="p-4 rounded-lg border bg-muted">
                            <h4 className="font-medium mb-2">Muted</h4>
                            <p className="text-sm text-muted-foreground">
                                Este é um exemplo de área com fundo muted.
                            </p>
                        </div>

                        <div className="p-4 rounded-lg bg-primary text-primary-foreground">
                            <h4 className="font-medium mb-2">Primary</h4>
                            <p className="text-sm opacity-90">
                                Cor primária do sistema.
                            </p>
                        </div>

                        <div className="p-4 rounded-lg bg-destructive text-destructive-foreground">
                            <h4 className="font-medium mb-2">Destructive</h4>
                            <p className="text-sm opacity-90">
                                Cor para ações destrutivas.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}