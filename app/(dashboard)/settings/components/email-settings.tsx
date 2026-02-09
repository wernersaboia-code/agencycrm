// app/(dashboard)/settings/components/email-settings.tsx

"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
    Mail,
    Server,
    Eye,
    EyeOff,
    Loader2,
    CheckCircle,
    XCircle,
    ExternalLink,
    Info,
    Trash2,
    Building,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

import {
    saveSmtpSettings,
    testSmtpSettings,
    clearSmtpSettings,
} from "@/actions/workspace-settings"
// Importar constantes do arquivo separado (não do lib/email.ts!)
import { SMTP_PROVIDERS, type SmtpProvider } from "@/lib/constants/smtp.constants"

// ============================================================
// TIPOS
// ============================================================

type WorkspaceSmtp = {
    id: string
    name: string
    smtpProvider: string | null
    smtpHost: string | null
    smtpPort: number | null
    smtpUser: string | null
    smtpPass: string | null
    smtpSecure: boolean
    senderName: string | null
    senderEmail: string | null
}

interface EmailSettingsProps {
    workspace: WorkspaceSmtp | null
    onUpdate?: () => void
}

// ============================================================
// SCHEMA
// ============================================================

const formSchema = z.object({
    smtpProvider: z.string().min(1, "Selecione um provedor"),
    smtpHost: z.string().optional(),
    smtpPort: z.coerce.number().optional(),
    smtpUser: z.string().email("Email inválido"),
    smtpPass: z.string().min(1, "Senha é obrigatória"),
    smtpSecure: z.boolean().default(false),
    senderName: z.string().optional(),
    senderEmail: z.string().email("Email inválido").optional().or(z.literal("")),
})

type FormData = z.infer<typeof formSchema>

// ============================================================
// COMPONENTE
// ============================================================

export function EmailSettings({ workspace, onUpdate }: EmailSettingsProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isClearing, setIsClearing] = useState(false)
    const [testResult, setTestResult] = useState<"success" | "error" | null>(null)

    const isConfigured = !!workspace?.smtpUser

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            smtpProvider: workspace?.smtpProvider || "",
            smtpHost: workspace?.smtpHost || "",
            smtpPort: workspace?.smtpPort || undefined,
            smtpUser: workspace?.smtpUser || "",
            smtpPass: workspace?.smtpPass || "",
            smtpSecure: workspace?.smtpSecure || false,
            senderName: workspace?.senderName || "",
            senderEmail: workspace?.senderEmail || "",
        },
    })

    const selectedProvider = form.watch("smtpProvider") as SmtpProvider
    const providerConfig = selectedProvider ? SMTP_PROVIDERS[selectedProvider] : null

    // Atualizar host/port quando mudar o provedor
    useEffect(() => {
        if (selectedProvider && selectedProvider !== "custom" && providerConfig) {
            form.setValue("smtpHost", providerConfig.host)
            form.setValue("smtpPort", providerConfig.port)
            form.setValue("smtpSecure", providerConfig.secure)
        }
    }, [selectedProvider, providerConfig, form])

    // ============================================================
    // HANDLERS
    // ============================================================

    const handleTest = async () => {
        const isValid = await form.trigger()
        if (!isValid) return

        setIsTesting(true)
        setTestResult(null)

        const data = form.getValues()
        const result = await testSmtpSettings({
            smtpProvider: data.smtpProvider,
            smtpHost: data.smtpHost || null,
            smtpPort: data.smtpPort || null,
            smtpUser: data.smtpUser,
            smtpPass: data.smtpPass,
            smtpSecure: data.smtpSecure,
            senderName: data.senderName || null,
            senderEmail: data.senderEmail || null,
        })

        setIsTesting(false)

        if (result.success) {
            setTestResult("success")
            toast.success("Conexão estabelecida com sucesso!")
        } else {
            setTestResult("error")
            toast.error(result.error || "Falha na conexão")
        }
    }

    const handleSave = async (data: FormData) => {
        if (!workspace) return

        setIsSaving(true)

        const result = await saveSmtpSettings(workspace.id, {
            smtpProvider: data.smtpProvider,
            smtpHost: data.smtpHost || null,
            smtpPort: data.smtpPort || null,
            smtpUser: data.smtpUser,
            smtpPass: data.smtpPass,
            smtpSecure: data.smtpSecure,
            senderName: data.senderName || null,
            senderEmail: data.senderEmail || null,
        })

        setIsSaving(false)

        if (result.success) {
            toast.success("Configurações salvas com sucesso!")
            onUpdate?.()
        } else {
            toast.error(result.error || "Erro ao salvar")
        }
    }

    const handleClear = async () => {
        if (!workspace) return
        if (!confirm("Tem certeza que deseja remover as configurações de email?")) {
            return
        }

        setIsClearing(true)
        const result = await clearSmtpSettings(workspace.id)
        setIsClearing(false)

        if (result.success) {
            form.reset({
                smtpProvider: "",
                smtpHost: "",
                smtpPort: undefined,
                smtpUser: "",
                smtpPass: "",
                smtpSecure: false,
                senderName: "",
                senderEmail: "",
            })
            setTestResult(null)
            toast.success("Configurações removidas!")
            onUpdate?.()
        } else {
            toast.error(result.error || "Erro ao remover")
        }
    }

    // ============================================================
    // RENDER
    // ============================================================

    if (!workspace) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                        <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Selecione um workspace para configurar o email.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Configurações de Email (SMTP)
                </CardTitle>
                <CardDescription>
                    Configure o servidor de email para enviar campanhas do workspace{" "}
                    <strong>{workspace.name}</strong>.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!isConfigured && (
                    <Alert className="mb-6">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Como configurar?</AlertTitle>
                        <AlertDescription>
                            <ol className="list-decimal list-inside space-y-2 mt-2 text-sm">
                                <li>
                                    <strong>Escolha seu provedor</strong> (Gmail, Zoho, Outlook, etc.)
                                </li>
                                <li>
                                    <strong>Crie uma "Senha de App"</strong> no seu provedor de email
                                    <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                                        <li>Gmail: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">myaccount.google.com/apppasswords</a></li>
                                        <li>Zoho: Configurações → Segurança → Senhas de App</li>
                                        <li>Outlook: Configurações → Segurança → Senhas de App</li>
                                    </ul>
                                </li>
                                <li>
                                    <strong>Preencha os campos</strong> com seu email e a senha de app gerada
                                </li>
                                <li>
                                    <strong>Teste a conexão</strong> antes de salvar
                                </li>
                            </ol>
                        </AlertDescription>
                    </Alert>
                )}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
                        {/* Status atual */}
                        {isConfigured && (
                            <Alert className={testResult === "error" ? "border-red-500" : "border-green-500"}>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <AlertTitle>Email configurado</AlertTitle>
                                <AlertDescription>
                                    Emails serão enviados de: <strong>{workspace.smtpUser}</strong>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Provedor */}
                        <FormField
                            control={form.control}
                            name="smtpProvider"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Provedor de Email *</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o provedor" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(SMTP_PROVIDERS).map(([key, provider]) => (
                                                <SelectItem key={key} value={key}>
                                                    {provider.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Info do provedor */}
                        {providerConfig?.helpText && (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>Dica</AlertTitle>
                                <AlertDescription className="flex items-center justify-between">
                                    <span>{providerConfig.helpText}</span>
                                    {providerConfig.helpUrl && (
                                        <a
                                            href={providerConfig.helpUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-1"
                                        >
                                            Saiba mais <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Campos SMTP (só mostra se for custom) */}
                        {selectedProvider === "custom" && (
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="smtpHost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Servidor SMTP</FormLabel>
                                            <FormControl>
                                                <Input placeholder="smtp.exemplo.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="smtpPort"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Porta</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="587"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <Separator />

                        {/* Credenciais */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="smtpUser"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email *</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="seu@email.com" {...field} />
                                        </FormControl>
                                        <FormDescription>O email que será usado para enviar</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="smtpPass"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Senha de App *</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••••••"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <FormDescription>Use uma senha de app, não sua senha normal</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        {/* Configurações do remetente */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="senderName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Remetente</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Sua Empresa" {...field} />
                                        </FormControl>
                                        <FormDescription>Como aparece no "De:" do email</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="senderEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email do Remetente</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="contato@suaempresa.com" {...field} />
                                        </FormControl>
                                        <FormDescription>Deixe vazio para usar o email acima</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* SSL/TLS */}
                        <FormField
                            control={form.control}
                            name="smtpSecure"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Conexão Segura (SSL/TLS)</FormLabel>
                                        <FormDescription>Ativar para porta 465, desativar para 587</FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* Resultado do teste */}
                        {testResult && (
                            <Alert variant={testResult === "success" ? "default" : "destructive"}>
                                {testResult === "success" ? (
                                    <CheckCircle className="h-4 w-4" />
                                ) : (
                                    <XCircle className="h-4 w-4" />
                                )}
                                <AlertTitle>{testResult === "success" ? "Conexão OK!" : "Falha na conexão"}</AlertTitle>
                                <AlertDescription>
                                    {testResult === "success"
                                        ? "As configurações estão corretas. Você pode salvar."
                                        : "Verifique o email e a senha de app."}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Botões */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button type="button" variant="outline" onClick={handleTest} disabled={isTesting || isSaving}>
                                {isTesting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Server className="h-4 w-4 mr-2" />
                                )}
                                Testar Conexão
                            </Button>

                            <Button type="submit" disabled={isTesting || isSaving}>
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Salvar Configurações
                            </Button>

                            {isConfigured && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleClear}
                                    disabled={isClearing || isTesting || isSaving}
                                    className="sm:ml-auto"
                                >
                                    {isClearing ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    Remover Configuração
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}