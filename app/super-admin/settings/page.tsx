import Link from "next/link"
import {
    CheckCircle2,
    Database,
    ExternalLink,
    KeyRound,
    LockKeyhole,
    Mail,
    ServerCog,
    Settings,
    ShieldCheck,
    ShoppingCart,
    XCircle,
} from "lucide-react"
import { getAuthenticatedDbUser } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export const metadata = {
    title: "Configurações | Super Admin",
    description: "Configurações operacionais e saúde das integrações do sistema.",
}

type ConfigStatus = {
    key: string
    label: string
    description: string
    configured: boolean
    critical: boolean
    value?: string
}

function getConfigStatuses(): ConfigStatus[] {
    return [
        {
            key: "NEXT_PUBLIC_SUPABASE_URL",
            label: "Supabase URL",
            description: "Endpoint público usado pelo cliente e autenticação.",
            configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
            critical: true,
            value: maskUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
        },
        {
            key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            label: "Supabase anon key",
            description: "Chave pública de autenticação do Supabase.",
            configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
            critical: true,
            value: maskSecret(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        },
        {
            key: "DATABASE_URL",
            label: "Database URL",
            description: "Conexão principal usada pelo Prisma.",
            configured: Boolean(process.env.DATABASE_URL),
            critical: true,
            value: maskSecret(process.env.DATABASE_URL),
        },
        {
            key: "DIRECT_URL",
            label: "Direct URL",
            description: "Conexão direta usada por Prisma/migrations quando necessário.",
            configured: Boolean(process.env.DIRECT_URL),
            critical: true,
            value: maskSecret(process.env.DIRECT_URL),
        },
        {
            key: "SECRETS_ENCRYPTION_KEY",
            label: "Encryption key",
            description: "Chave usada para criptografar segredos como SMTP.",
            configured: Boolean(process.env.SECRETS_ENCRYPTION_KEY),
            critical: true,
            value: process.env.SECRETS_ENCRYPTION_KEY ? "Configurada" : undefined,
        },
        {
            key: "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
            label: "PayPal client ID",
            description: "Identificador público do checkout PayPal.",
            configured: Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID),
            critical: false,
            value: maskSecret(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID),
        },
        {
            key: "PAYPAL_CLIENT_SECRET",
            label: "PayPal client secret",
            description: "Segredo do PayPal usado para criar e capturar pedidos.",
            configured: Boolean(process.env.PAYPAL_CLIENT_SECRET),
            critical: false,
            value: maskSecret(process.env.PAYPAL_CLIENT_SECRET),
        },
        {
            key: "CRON_SECRET",
            label: "Cron secret",
            description: "Protege a rota de processamento automático de sequências.",
            configured: Boolean(process.env.CRON_SECRET),
            critical: false,
            value: process.env.CRON_SECRET ? "Configurado" : undefined,
        },
        {
            key: "NEXT_PUBLIC_APP_URL",
            label: "App URL",
            description: "URL pública usada em callbacks, links e redirecionamentos.",
            configured: Boolean(process.env.NEXT_PUBLIC_APP_URL),
            critical: false,
            value: maskUrl(process.env.NEXT_PUBLIC_APP_URL),
        },
    ]
}

export default async function SuperAdminSettingsPage() {
    const user = await getAuthenticatedDbUser()
    const configs = getConfigStatuses()
    const missingCritical = configs.filter((item) => item.critical && !item.configured)
    const configuredCount = configs.filter((item) => item.configured).length
    const paypalMode = process.env.PAYPAL_MODE === "live" ? "live" : "sandbox"

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                    <p className="text-muted-foreground">
                        Saúde das integrações, ambiente e limites operacionais da plataforma.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/super-admin/analytics">
                        Ver analytics
                        <ExternalLink className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatusSummary
                    title="Ambiente"
                    value={`${configuredCount}/${configs.length}`}
                    description="variáveis configuradas"
                    healthy={missingCritical.length === 0}
                    icon={ServerCog}
                />
                <StatusSummary
                    title="PayPal"
                    value={paypalMode}
                    description={isPaypalReady(configs) ? "checkout configurado" : "checkout incompleto"}
                    healthy={isPaypalReady(configs)}
                    icon={ShoppingCart}
                />
                <StatusSummary
                    title="Admin atual"
                    value={user?.name || "Admin"}
                    description={user?.email || "Sessão administrativa"}
                    healthy={user?.status === "ACTIVE"}
                    icon={ShieldCheck}
                />
            </div>

            {missingCritical.length > 0 && (
                <Card className="border-red-300 bg-red-50/60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-800">
                            <XCircle className="h-5 w-5" />
                            Configurações críticas pendentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-red-800">
                        {missingCritical.map((item) => (
                            <p key={item.key}>
                                <strong>{item.key}</strong>: {item.description}
                            </p>
                        ))}
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Variáveis e integrações
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {configs.map((config) => (
                            <ConfigRow key={config.key} config={config} />
                        ))}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <KeyRound className="h-5 w-5" />
                                Operação segura
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <p>
                                Valores sensíveis são mascarados nesta tela. Alterações continuam sendo feitas no provedor de ambiente, como Vercel e Supabase.
                            </p>
                            <Separator />
                            <ChecklistItem checked={Boolean(process.env.SECRETS_ENCRYPTION_KEY)} text="Chave de criptografia configurada" />
                            <ChecklistItem checked={Boolean(process.env.CRON_SECRET)} text="Cron protegido por segredo" />
                            <ChecklistItem checked={isPaypalReady(configs)} text="PayPal pronto para checkout" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Links administrativos</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <AdminLink href="/super-admin/users" label="Gerenciar usuários" />
                            <AdminLink href="/super-admin/workspaces" label="Gerenciar workspaces" />
                            <AdminLink href="/super-admin/marketplace/lists" label="Gerenciar listas" />
                            <AdminLink href="/super-admin/marketplace/purchases" label="Consultar vendas" />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Limites atuais dos planos</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-4">
                    <PlanLimit name="FREE" leads="Ilimitado" users="1 usuário" emails="Ilimitado" />
                    <PlanLimit name="TRIAL" leads="Conforme workspace" users="1 usuário" emails="Conforme workspace" />
                    <PlanLimit name="STARTER" leads="5.000 leads" users="1 usuário" emails="Diário configurável" />
                    <PlanLimit name="PRO" leads="50.000 leads" users="3 usuários" emails="Diário configurável" />
                </CardContent>
            </Card>
        </div>
    )
}

function isPaypalReady(configs: ConfigStatus[]) {
    return configs.some((item) => item.key === "NEXT_PUBLIC_PAYPAL_CLIENT_ID" && item.configured)
        && configs.some((item) => item.key === "PAYPAL_CLIENT_SECRET" && item.configured)
}

function maskSecret(value?: string) {
    if (!value) return undefined
    if (value.length <= 8) return "Configurado"
    return `${value.slice(0, 4)}...${value.slice(-4)}`
}

function maskUrl(value?: string) {
    if (!value) return undefined

    try {
        const url = new URL(value)
        return url.host
    } catch {
        return "Configurada"
    }
}

function StatusSummary({
    title,
    value,
    description,
    healthy,
    icon: Icon,
}: {
    title: string
    value: string
    description: string
    healthy: boolean
    icon: React.ComponentType<{ className?: string }>
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className={healthy ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-amber-600"} />
            </CardHeader>
            <CardContent>
                <div className="truncate text-2xl font-bold">{value}</div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

function ConfigRow({ config }: { config: ConfigStatus }) {
    return (
        <div className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 gap-3">
                <div className={config.configured ? "text-emerald-600" : config.critical ? "text-red-600" : "text-amber-600"}>
                    {config.configured ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{config.label}</p>
                        {config.critical && <Badge variant="outline">crítica</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{config.key}</p>
                </div>
            </div>
            <div className="shrink-0 text-left md:text-right">
                <Badge variant={config.configured ? "default" : "outline"}>
                    {config.configured ? "Configurada" : "Pendente"}
                </Badge>
                {config.value && (
                    <p className="mt-2 max-w-[240px] truncate font-mono text-xs text-muted-foreground">
                        {config.value}
                    </p>
                )}
            </div>
        </div>
    )
}

function ChecklistItem({ checked, text }: { checked: boolean; text: string }) {
    return (
        <div className="flex items-center gap-2">
            {checked ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
                <XCircle className="h-4 w-4 text-amber-600" />
            )}
            <span>{text}</span>
        </div>
    )
}

function AdminLink({ href, label }: { href: string; label: string }) {
    return (
        <Button variant="outline" className="justify-between" asChild>
            <Link href={href}>
                {label}
                <ExternalLink className="h-4 w-4" />
            </Link>
        </Button>
    )
}

function PlanLimit({
    name,
    leads,
    users,
    emails,
}: {
    name: string
    leads: string
    users: string
    emails: string
}) {
    return (
        <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold">
                <Database className="h-4 w-4 text-violet-600" />
                {name}
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><LockKeyhole className="h-4 w-4" />{leads}</p>
                <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />{users}</p>
                <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{emails}</p>
            </div>
        </div>
    )
}
