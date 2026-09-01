import Link from "next/link"
import {
    CheckCircle2,
    CreditCard,
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
import { getAdminTranslations } from "@/lib/i18n/admin-locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export async function generateMetadata() {
    const t = await getAdminTranslations("admin.settings")

    return {
        title: t("metaTitle"),
        description: t("metaDesc"),
    }
}

type ConfigStatus = {
    key: string
    label: string
    description: string
    configured: boolean
    critical: boolean
    value?: string
}

type Traduzir = Awaited<ReturnType<typeof getAdminTranslations>>

function getConfigStatuses(t: Traduzir, common: Traduzir): ConfigStatus[] {
    return [
        {
            key: "NEXT_PUBLIC_SUPABASE_URL",
            label: "Supabase URL",
            description: t("vars.NEXT_PUBLIC_SUPABASE_URL"),
            configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
            critical: true,
            value: maskUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
        },
        {
            key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            label: "Supabase anon key",
            description: t("vars.NEXT_PUBLIC_SUPABASE_ANON_KEY"),
            configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
            critical: true,
            value: maskSecret(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, common),
        },
        {
            key: "DATABASE_URL",
            label: "Database URL",
            description: t("vars.DATABASE_URL"),
            configured: Boolean(process.env.DATABASE_URL),
            critical: true,
            value: maskSecret(process.env.DATABASE_URL, common),
        },
        {
            key: "DIRECT_URL",
            label: "Direct URL",
            description: t("vars.DIRECT_URL"),
            configured: Boolean(process.env.DIRECT_URL),
            critical: true,
            value: maskSecret(process.env.DIRECT_URL, common),
        },
        {
            key: "SECRETS_ENCRYPTION_KEY",
            label: "Encryption key",
            description: t("vars.SECRETS_ENCRYPTION_KEY"),
            configured: Boolean(process.env.SECRETS_ENCRYPTION_KEY),
            critical: true,
            value: maskSecret(process.env.SECRETS_ENCRYPTION_KEY, common),
        },
        {
            key: "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
            label: "PayPal client ID",
            description: t("vars.NEXT_PUBLIC_PAYPAL_CLIENT_ID"),
            configured: Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID),
            critical: false,
            value: maskSecret(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID, common),
        },
        {
            key: "PAYPAL_CLIENT_SECRET",
            label: "PayPal client secret",
            description: t("vars.PAYPAL_CLIENT_SECRET"),
            configured: Boolean(process.env.PAYPAL_CLIENT_SECRET),
            critical: false,
            value: maskSecret(process.env.PAYPAL_CLIENT_SECRET, common),
        },
        {
            key: "CRON_SECRET",
            label: "Cron secret",
            description: t("vars.CRON_SECRET"),
            configured: Boolean(process.env.CRON_SECRET),
            critical: false,
            value: maskSecret(process.env.CRON_SECRET, common),
        },
        {
            key: "NEXT_PUBLIC_APP_URL",
            label: "App URL",
            description: t("vars.NEXT_PUBLIC_APP_URL"),
            configured: Boolean(process.env.NEXT_PUBLIC_APP_URL),
            critical: false,
            value: maskUrl(process.env.NEXT_PUBLIC_APP_URL),
        },
        {
            key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
            label: "Stripe publishable key",
            description: t("vars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
            configured: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
            critical: false,
            value: maskSecret(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, common),
        },
        {
            key: "STRIPE_SECRET_KEY",
            label: "Stripe secret key",
            description: t("vars.STRIPE_SECRET_KEY"),
            configured: Boolean(process.env.STRIPE_SECRET_KEY),
            critical: false,
            value: maskSecret(process.env.STRIPE_SECRET_KEY, common),
        },
        {
            key: "STRIPE_WEBHOOK_SECRET",
            label: "Stripe webhook secret",
            description: t("vars.STRIPE_WEBHOOK_SECRET"),
            configured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
            critical: false,
            value: maskSecret(process.env.STRIPE_WEBHOOK_SECRET, common),
        },
        {
            key: "SELLER_NAME",
            label: "Vendedor — razão social",
            description: t("vars.SELLER_NAME"),
            configured: Boolean(process.env.SELLER_NAME?.trim()),
            critical: false,
            value: process.env.SELLER_NAME?.trim() || undefined,
        },
        {
            key: "SELLER_ADDRESS",
            label: "Vendedor — endereço",
            description: t("vars.SELLER_ADDRESS"),
            configured: Boolean(process.env.SELLER_ADDRESS?.trim()),
            critical: false,
            value: process.env.SELLER_ADDRESS?.trim() || undefined,
        },
    ]
}

export default async function SuperAdminSettingsPage() {
    const user = await getAuthenticatedDbUser()
    const t = await getAdminTranslations("admin.settings")
    const common = await getAdminTranslations("admin.common")
    const configs = getConfigStatuses(t, common)
    const missingCritical = configs.filter((item) => item.critical && !item.configured)
    const configuredCount = configs.filter((item) => item.configured).length
    const paypalMode = process.env.PAYPAL_MODE === "live" ? "live" : "sandbox"
    const stripeMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "live" : "sandbox"

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                    <p className="text-muted-foreground">
                        {t("subtitle")}
                    </p>
                </div>
                <Button asChild>
                    <Link href="/super-admin/analytics">
                        {t("viewAnalytics")}
                        <ExternalLink className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatusSummary
                    title={t("environment")}
                    value={`${configuredCount}/${configs.length}`}
                    description={t("varsConfiguredLabel")}
                    healthy={missingCritical.length === 0}
                    icon={ServerCog}
                />
                <StatusSummary
                    title={t("paypal")}
                    value={paypalMode}
                    description={isPaypalReady(configs) ? t("checkoutReady") : t("checkoutIncomplete")}
                    healthy={isPaypalReady(configs)}
                    icon={ShoppingCart}
                />
                <StatusSummary
                    title={t("stripe")}
                    value={stripeMode}
                    description={isStripeReady(configs) ? t("checkoutReady") : t("checkoutIncomplete")}
                    healthy={isStripeReady(configs)}
                    icon={CreditCard}
                />
                <StatusSummary
                    title={t("currentAdmin")}
                    value={user?.name || "Admin"}
                    description={user?.email || common("session")}
                    healthy={user?.status === "ACTIVE"}
                    icon={ShieldCheck}
                />
            </div>

            {missingCritical.length > 0 && (
                <Card className="border-red-300 bg-red-50/60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-800">
                            <XCircle className="h-5 w-5" />
                            {t("criticalMissing")}
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
                            {t("varsIntegrations")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {configs.map((config) => (
                            <ConfigRow key={config.key} config={config} t={t} common={common} />
                        ))}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <KeyRound className="h-5 w-5" />
                                {t("secureOps")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <p>
                                {t("secureDesc")}
                            </p>
                            <Separator />
                            <ChecklistItem checked={Boolean(process.env.SECRETS_ENCRYPTION_KEY)} text={t("encryptionKeySet")} />
                            <ChecklistItem checked={Boolean(process.env.CRON_SECRET)} text={t("cronProtected")} />
                            <ChecklistItem checked={isPaypalReady(configs)} text={t("paypalReady")} />
                            <ChecklistItem checked={isStripeReady(configs)} text={t("stripeReady")} />
                            <ChecklistItem checked={isReceiptReady(configs)} text={t("receiptReady")} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("adminLinks")}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <AdminLink href="/super-admin/users" label={t("manageUsers")} />
                            <AdminLink href="/super-admin/workspaces" label={t("manageWorkspaces")} />
                            <AdminLink href="/super-admin/marketplace/lists" label={t("manageLists")} />
                            <AdminLink href="/super-admin/marketplace/purchases" label={t("checkSales")} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("planLimits")}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-4">
                    <PlanLimit name="FREE" leads={t("unlimited")} users={t("user1")} emails={t("unlimited")} />
                    <PlanLimit name="TRIAL" leads={t("perWorkspace")} users={t("user1")} emails={t("perWorkspace")} />
                    <PlanLimit name="STARTER" leads={t("leads5k")} users={t("user1")} emails={t("configurableDaily")} />
                    <PlanLimit name="PRO" leads={t("leads50k")} users={t("users3")} emails={t("configurableDaily")} />
                </CardContent>
            </Card>
        </div>
    )
}

function isPaypalReady(configs: ConfigStatus[]) {
    return configs.some((item) => item.key === "NEXT_PUBLIC_PAYPAL_CLIENT_ID" && item.configured)
        && configs.some((item) => item.key === "PAYPAL_CLIENT_SECRET" && item.configured)
}

function isStripeReady(configs: ConfigStatus[]) {
    return configs.some((item) => item.key === "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" && item.configured)
        && configs.some((item) => item.key === "STRIPE_SECRET_KEY" && item.configured)
        && configs.some((item) => item.key === "STRIPE_WEBHOOK_SECRET" && item.configured)
}

/**
 * O comprovante de compra só é gerado e oferecido quando há vendedor
 * identificável — nome e endereço. Mesma regra de `vendedorEstaConfigurado`,
 * lida aqui pela lista para reaproveitar o estado já montado.
 */
function isReceiptReady(configs: ConfigStatus[]) {
    return configs.some((item) => item.key === "SELLER_NAME" && item.configured)
        && configs.some((item) => item.key === "SELLER_ADDRESS" && item.configured)
}

function maskSecret(value: string | undefined, common: Traduzir) {
    if (!value) return undefined
    return common("configured")
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
                <Icon className={healthy ? "h-4 w-4 text-admin" : "h-4 w-4 text-amber-600"} />
            </CardHeader>
            <CardContent>
                <div className="truncate text-2xl font-bold">{value}</div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

function ConfigRow({ config, t, common }: { config: ConfigStatus; t: Traduzir; common: Traduzir }) {
    return (
        <div className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 gap-3">
                <div className={config.configured ? "text-admin" : config.critical ? "text-red-600" : "text-amber-600"}>
                    {config.configured ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{config.label}</p>
                        {config.critical && <Badge variant="outline">{t("criticalBadge")}</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{config.key}</p>
                </div>
            </div>
            <div className="shrink-0 text-left md:text-right">
                <Badge variant={config.configured ? "default" : "outline"}>
                    {config.configured ? common("configured") : common("pending")}
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
                <CheckCircle2 className="h-4 w-4 text-admin" />
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
