// app/(dashboard)/settings/settings-client.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Settings,
    User,
    Palette,
    Mail,
    Users,
    Send,
    FileText,
    Phone,
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { ProfileSettings } from "./components/profile-settings"
import { AppearanceSettings } from "./components/appearance-settings"
import { EmailSettings } from "./components/email-settings"
import { getWorkspaceSmtpSettings } from "@/actions/workspace-settings"

// ============================================================
// TIPOS
// ============================================================

type Profile = {
    id: string
    name: string | null
    email: string
    avatar: string | null
    role: string
    language: string
    timezone: string
    createdAt: string
} | null

type Stats = {
    leads: number
    campaigns: number
    templates: number
    calls: number
}

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
} | null

interface SettingsClientProps {
    profile: Profile
    stats: Stats
    workspaceId?: string
}

// ============================================================
// COMPONENTE
// ============================================================

export function SettingsClient({
                                   profile,
                                   stats,
                                   workspaceId,
                               }: SettingsClientProps) {
    const router = useRouter()
    const [workspace, setWorkspace] = useState<WorkspaceSmtp>(null)
    const [loadingWorkspace, setLoadingWorkspace] = useState(false)

    // Carregar configurações SMTP do workspace
    useEffect(() => {
        async function loadWorkspace() {
            if (!workspaceId) return

            setLoadingWorkspace(true)
            const result = await getWorkspaceSmtpSettings(workspaceId)
            setLoadingWorkspace(false)

            if (result.success && result.data) {
                setWorkspace(result.data)
            }
        }

        loadWorkspace()
    }, [workspaceId])

    const handleEmailUpdate = () => {
        router.refresh()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Settings className="h-8 w-8" />
                    Configurações
                </h1>
                <p className="text-muted-foreground mt-1">
                    Gerencie suas preferências e configurações do sistema
                </p>
            </div>

            {/* Stats Cards - Atualizados para AgencyCRM */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Leads
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.leads}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Campanhas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.campaigns}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Templates
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.templates}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Ligações
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.calls}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs de configurações - Sem Pipeline */}
            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Perfil</span>
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="gap-2">
                        <Palette className="h-4 w-4" />
                        <span className="hidden sm:inline">Aparência</span>
                    </TabsTrigger>
                    <TabsTrigger value="email" className="gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="hidden sm:inline">Email</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <ProfileSettings profile={profile} />
                </TabsContent>

                <TabsContent value="appearance">
                    <AppearanceSettings />
                </TabsContent>

                <TabsContent value="email">
                    <EmailSettings workspace={workspace} onUpdate={handleEmailUpdate} />
                </TabsContent>
            </Tabs>
        </div>
    )
}