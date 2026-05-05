// app/(crm)/settings/settings-client.tsx
"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, Mail, Palette, Settings, User, Building2 } from "lucide-react"
import { ProfileSettings } from "./components/profile-settings"
import { AppearanceSettings } from "./components/appearance-settings"
import { EmailSettings } from "./components/email-settings"
import { WorkspaceSettings } from "@/components/settings/workspace-settings"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// ============================================================
// TIPOS
// ============================================================

interface Profile {
    id: string
    name: string | null
    email: string
    avatar: string | null
    role: string
    language: string
    timezone: string
    createdAt: string
}

interface SettingsClientProps {
    profile: Profile | null
    workspace: {
        id: string
        name: string
        description: string | null
        color: string
        logo: string | null
        senderName: string | null
        senderEmail: string | null
        smtpProvider: string | null
        smtpHost: string | null
        smtpPort: number | null
        smtpUser: string | null
        smtpPass: string | null
        smtpSecure: boolean
    }
    stats: {
        totalLeads: number
        totalCampaigns: number
        totalTemplates: number
        totalCalls: number
    }
}

// ============================================================
// COMPONENTE
// ============================================================

const SETTINGS_TABS = ["workspace", "profile", "appearance", "email"] as const
type SettingsTab = (typeof SETTINGS_TABS)[number]

function getInitialTab(tab: string | null): SettingsTab {
    return SETTINGS_TABS.includes(tab as SettingsTab) ? (tab as SettingsTab) : "workspace"
}

export function SettingsClient({ profile, workspace, stats }: SettingsClientProps) {
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState<SettingsTab>(() => getInitialTab(searchParams.get("tab")))
    const hasSenderConfigured = Boolean(workspace.senderName && workspace.senderEmail)
    const hasSmtpConfigured = Boolean(workspace.smtpProvider && workspace.smtpUser)
    const readyItems = useMemo<Array<{
        label: string
        description: string
        done: boolean
        tab: SettingsTab
    }>>(
        () => [
            {
                label: "Identidade do workspace",
                description: workspace.description ? "Nome e descrição preenchidos." : "Adicione uma descrição curta para orientar o time.",
                done: Boolean(workspace.name && workspace.description),
                tab: "workspace",
            },
            {
                label: "Remetente",
                description: hasSenderConfigured ? `${workspace.senderName} <${workspace.senderEmail}>` : "Defina nome e email do remetente.",
                done: hasSenderConfigured,
                tab: "email",
            },
            {
                label: "SMTP",
                description: hasSmtpConfigured ? `${workspace.smtpProvider} conectado como ${workspace.smtpUser}` : "Configure o provedor de envio.",
                done: hasSmtpConfigured,
                tab: "email",
            },
        ],
        [hasSenderConfigured, hasSmtpConfigured, workspace]
    )
    const completedItems = readyItems.filter((item) => item.done).length
    const isWorkspaceReady = completedItems === readyItems.length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground">
                    Gerencie suas preferências e configurações do workspace
                </p>
            </div>

            <Card className={isWorkspaceReady ? "border-emerald-300 dark:border-emerald-900" : "border-amber-300 dark:border-amber-900"}>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <CardTitle>Prontidão do workspace</CardTitle>
                            <Badge variant={isWorkspaceReady ? "default" : "outline"}>
                                {completedItems}/{readyItems.length} completo
                            </Badge>
                        </div>
                        <CardDescription>
                            Confira os fundamentos que liberam campanhas, respostas e colaboração sem fricção.
                        </CardDescription>
                    </div>
                    <Button
                        type="button"
                        variant={isWorkspaceReady ? "outline" : "default"}
                        onClick={() => setActiveTab(hasSmtpConfigured && hasSenderConfigured ? "workspace" : "email")}
                    >
                        {isWorkspaceReady ? (
                            <Settings className="h-4 w-4" />
                        ) : (
                            <Mail className="h-4 w-4" />
                        )}
                        {isWorkspaceReady ? "Revisar workspace" : "Configurar envio"}
                    </Button>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                    {readyItems.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => setActiveTab(item.tab)}
                            className="flex min-h-[96px] items-start gap-3 rounded-lg border bg-background p-4 text-left transition-colors hover:bg-muted/50"
                        >
                            {item.done ? (
                                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                            ) : (
                                <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
                            )}
                            <span className="space-y-1">
                                <span className="block font-medium leading-tight">{item.label}</span>
                                <span className="block text-sm text-muted-foreground">{item.description}</span>
                            </span>
                        </button>
                    ))}
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Leads</p>
                    <p className="text-2xl font-bold">{stats.totalLeads}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Campanhas</p>
                    <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Templates</p>
                    <p className="text-2xl font-bold">{stats.totalTemplates}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Ligações</p>
                    <p className="text-2xl font-bold">{stats.totalCalls}</p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(getInitialTab(value))}>
                <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                    <TabsTrigger value="workspace" className="inline-flex items-center gap-2 px-3">
                        <Building2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Workspace</span>
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="inline-flex items-center gap-2 px-3">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Perfil</span>
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="inline-flex items-center gap-2 px-3">
                        <Palette className="h-4 w-4" />
                        <span className="hidden sm:inline">Aparência</span>
                    </TabsTrigger>
                    <TabsTrigger value="email" className="inline-flex items-center gap-2 px-3">
                        <Mail className="h-4 w-4" />
                        <span className="hidden sm:inline">Email</span>
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="workspace">
                        <WorkspaceSettings workspace={workspace} />
                    </TabsContent>

                    <TabsContent value="profile">
                        <ProfileSettings profile={profile} />
                    </TabsContent>

                    <TabsContent value="appearance">
                        <AppearanceSettings />
                    </TabsContent>

                    <TabsContent value="email">
                        <EmailSettings workspace={workspace} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
