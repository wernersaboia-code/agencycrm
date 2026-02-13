// app/(dashboard)/leads/[id]/lead-detail-client.tsx

"use client"

// ============================================
// IMPORTS
// ============================================
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    ArrowLeft,
    Building2,
    Mail,
    Phone,
    Globe,
    MapPin,
    Briefcase,
    Pencil,
    Tag,
    User,
    FileText,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { LeadCallsSection } from "@/components/calls/LeadCallsSection"
import { LeadTimeline } from "@/components/leads/LeadTimeline"

import { LEAD_STATUS_CONFIG } from "@/lib/constants/lead.constants"
import { SerializedCallWithLead } from "@/types/call.types"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface LeadData {
    id: string
    firstName: string
    lastName: string | null
    email: string
    phone: string | null
    mobile: string | null
    company: string | null
    jobTitle: string | null
    website: string | null
    industry: string | null
    companySize: string | null
    address: string | null
    city: string | null
    state: string | null
    country: string | null
    postalCode: string | null
    taxId: string | null
    status: string
    source: string
    notes: string | null
    workspaceId: string
    createdAt: string
    updatedAt: string
}

interface EmailSendInfo {
    id: string
    campaignName: string
    status: string
    sentAt: string | null
    openedAt: string | null
    clickedAt: string | null
}

interface LeadDetailClientProps {
    lead: LeadData
    initialCalls: SerializedCallWithLead[]
    initialEmailSends: EmailSendInfo[]
}

// ============================================
// COMPONENT
// ============================================

export function LeadDetailClient({
                                     lead,
                                     initialCalls,
                                     initialEmailSends,
                                 }: LeadDetailClientProps) {
    const router = useRouter()

    // ============================================
    // COMPUTED
    // ============================================

    const fullName = `${lead.firstName} ${lead.lastName || ""}`.trim()
    const statusConfig = LEAD_STATUS_CONFIG[lead.status as keyof typeof LEAD_STATUS_CONFIG]

    const fullAddress = [
        lead.address,
        lead.city,
        lead.state,
        lead.postalCode,
        lead.country,
    ]
        .filter(Boolean)
        .join(", ")

    // ============================================
    // HANDLERS
    // ============================================

    const handleGoBack = (): void => {
        router.push("/leads")
    }

    const handleEditLead = (): void => {
        router.push(`/leads?edit=${lead.id}`)
    }

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleGoBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <User className="h-6 w-6" />
                            {fullName}
                        </h1>
                        <p className="text-muted-foreground">{lead.email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {statusConfig && (
                        <Badge
                            variant="outline"
                            className={cn(statusConfig.textColor, statusConfig.bgColor)}
                        >
                            {statusConfig.label}
                        </Badge>
                    )}
                    <Button onClick={handleEditLead}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                    </Button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Coluna Principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Seção de Ligações */}
                    <LeadCallsSection
                        leadId={lead.id}
                        leadName={fullName}
                        workspaceId={lead.workspaceId}
                        initialCalls={initialCalls}
                    />

                    {/* Timeline Completa */}
                    <LeadTimeline calls={initialCalls} emailSends={initialEmailSends} />
                </div>

                {/* Sidebar - Informações do Lead */}
                <div className="space-y-6">
                    {/* Informações de Contato */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Informações de Contato</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <InfoRow icon={Mail} label="Email" value={lead.email} />
                            {lead.phone && (
                                <InfoRow icon={Phone} label="Telefone" value={lead.phone} />
                            )}
                            {lead.mobile && (
                                <InfoRow icon={Phone} label="Celular" value={lead.mobile} />
                            )}
                            {lead.website && (
                                <InfoRow icon={Globe} label="Website" value={lead.website} isLink />
                            )}
                        </CardContent>
                    </Card>

                    {/* Informações da Empresa */}
                    {(lead.company || lead.jobTitle || lead.industry) && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Empresa</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {lead.company && (
                                    <InfoRow icon={Building2} label="Empresa" value={lead.company} />
                                )}
                                {lead.jobTitle && (
                                    <InfoRow icon={Briefcase} label="Cargo" value={lead.jobTitle} />
                                )}
                                {lead.industry && (
                                    <InfoRow icon={Tag} label="Segmento" value={lead.industry} />
                                )}
                                {lead.companySize && (
                                    <InfoRow icon={Building2} label="Porte" value={lead.companySize} />
                                )}
                                {lead.taxId && (
                                    <InfoRow icon={FileText} label="CNPJ/Tax ID" value={lead.taxId} />
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Localização */}
                    {fullAddress && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Localização</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <span>{fullAddress}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notas */}
                    {lead.notes && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Notas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {lead.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Metadados */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Informações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Origem</span>
                                <Badge variant="secondary">{lead.source}</Badge>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Criado em</span>
                                <span>
                  {format(new Date(lead.createdAt), "dd/MM/yyyy", {
                      locale: ptBR,
                  })}
                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Atualizado em</span>
                                <span>
                  {format(new Date(lead.updatedAt), "dd/MM/yyyy", {
                      locale: ptBR,
                  })}
                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

// ============================================
// SUBCOMPONENTS
// ============================================

interface InfoRowProps {
    icon: typeof Mail
    label: string
    value: string
    isLink?: boolean
}

function InfoRow({ icon: Icon, label, value, isLink = false }: InfoRowProps) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{label}:</span>
            {isLink ? (
                <a
                    href={value.startsWith("http") ? value : `https://${value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                >
                    {value}
                </a>
            ) : (
                <span className="truncate">{value}</span>
            )}
        </div>
    )
}