// app/(dashboard)/settings/settings-client.tsx

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Settings,
    User,
    Palette,
    GitBranch,
    Mail,
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { ProfileSettings } from "./components/profile-settings"
import { AppearanceSettings } from "./components/appearance-settings"
import { PipelineSettings } from "./components/pipeline-settings"
import { EmailSettings } from "./components/email-settings"
import { getWorkspaceSmtpSettings } from "@/actions/workspace-settings"

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

type Stage = {
    id: string
    name: string
    color: string
    order: number
    isActive: boolean
    dealsCount: number
}

type Stats = {
    contacts: number
    companies: number
    deals: number
    tasks: number
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

type SettingsClientProps = {
    profile: Profile
    stages: Stage[]
    stats: Stats
    workspaceId?: string
}

export function SettingsClient({ profile, stages: initialStages, stats, workspaceId }: SettingsClientProps) {
    const router = useRouter()
    const [stages, setStages] = useState(initialStages)
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

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Contatos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.contacts}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Empresas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.companies}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Deals
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.deals}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tarefas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.tasks}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs de configurações */}
            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Perfil</span>
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="gap-2">
                        <Palette className="h-4 w-4" />
                        <span className="hidden sm:inline">Aparência</span>
                    </TabsTrigger>
                    <TabsTrigger value="pipeline" className="gap-2">
                        <GitBranch className="h-4 w-4" />
                        <span className="hidden sm:inline">Pipeline</span>
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

                <TabsContent value="pipeline">
                    <PipelineSettings stages={stages} onStagesChange={setStages} />
                </TabsContent>

                <TabsContent value="email">
                    <EmailSettings workspace={workspace} onUpdate={handleEmailUpdate} />
                </TabsContent>
            </Tabs>
        </div>
    )
}