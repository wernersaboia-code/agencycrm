// app/(dashboard)/settings/components/profile-settings.tsx

"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2, User, Mail, Calendar, Shield } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

import { updateUserProfile } from "@/actions/settings"

const profileSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
})

type ProfileFormValues = z.infer<typeof profileSchema>

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

type ProfileSettingsProps = {
    profile: Profile
}

const roleLabels: Record<string, string> = {
    ADMIN: "Administrador",
    MANAGER: "Gerente",
    USER: "Usuário",
}

export function ProfileSettings({ profile }: ProfileSettingsProps) {
    const [isPending, startTransition] = useTransition()

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: profile?.name || "",
        },
    })

    function onSubmit(values: ProfileFormValues) {
        startTransition(async () => {
            const result = await updateUserProfile(values)

            if (result.success) {
                toast.success("Perfil atualizado com sucesso!")
            } else {
                toast.error(result.error || "Erro ao atualizar perfil")
            }
        })
    }

    if (!profile) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Erro ao carregar perfil</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Informações da conta */}
            <Card>
                <CardHeader>
                    <CardTitle>Informações da Conta</CardTitle>
                    <CardDescription>
                        Dados básicos da sua conta
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-medium">{profile.name || "Sem nome"}</h3>
                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                        </div>
                        <Badge variant="secondary" className="ml-auto">
                            {roleLabels[profile.role] || profile.role}
                        </Badge>
                    </div>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{profile.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Membro desde</p>
                                <p className="font-medium">
                                    {format(new Date(profile.createdAt), "dd 'de' MMMM 'de' yyyy", {
                                        locale: ptBR,
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Editar perfil */}
            <Card>
                <CardHeader>
                    <CardTitle>Editar Perfil</CardTitle>
                    <CardDescription>
                        Atualize suas informações pessoais
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Seu nome" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Este nome será exibido no sistema
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Salvar alterações
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}