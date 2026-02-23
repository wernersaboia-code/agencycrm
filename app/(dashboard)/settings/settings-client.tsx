// app/(dashboard)/settings/settings-client.tsx
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Palette, Mail, Building2 } from "lucide-react"
import { ProfileSettings } from "./components/profile-settings"
import { AppearanceSettings } from "./components/appearance-settings"
import { EmailSettings } from "./components/email-settings"
import { WorkspaceSettings } from "@/components/settings/workspace-settings"

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

export function SettingsClient({ profile, workspace, stats }: SettingsClientProps) {
    const [activeTab, setActiveTab] = useState("workspace")

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground">
                    Gerencie suas preferências e configurações do workspace
                </p>
            </div>

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
            <Tabs value={activeTab} onValueChange={setActiveTab}>
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