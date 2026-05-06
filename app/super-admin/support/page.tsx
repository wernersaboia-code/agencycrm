import Link from "next/link"
import { LifeBuoy, Mail, Settings, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata = {
    title: "Suporte | Super Admin",
    description: "Central operacional de suporte do super-admin.",
}

export default function SuperAdminSupportPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Suporte</h1>
                <p className="text-muted-foreground">
                    Atalhos para investigar problemas de usuários, workspaces e configuração.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <SupportCard
                    title="Usuários"
                    description="Consulte status, dados de conta e acesso."
                    href="/super-admin/users"
                    icon={Users}
                />
                <SupportCard
                    title="Workspaces"
                    description="Revise dados, limites, campanhas e leads."
                    href="/super-admin/workspaces"
                    icon={LifeBuoy}
                />
                <SupportCard
                    title="Configuração"
                    description="Cheque integrações e variáveis de ambiente."
                    href="/super-admin/settings"
                    icon={Settings}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Fluxo recomendado
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>1. Confirme se o usuário está ativo em Usuários.</p>
                    <p>2. Confira workspace, plano, limites e dados de envio.</p>
                    <p>3. Use Configurações para validar ambiente, PayPal, Supabase e chaves críticas.</p>
                </CardContent>
            </Card>
        </div>
    )
}

function SupportCard({
    title,
    description,
    href,
    icon: Icon,
}: {
    title: string
    description: string
    href: string
    icon: React.ComponentType<{ className?: string }>
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{description}</p>
                <Button asChild className="w-full">
                    <Link href={href}>
                        Abrir
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}
