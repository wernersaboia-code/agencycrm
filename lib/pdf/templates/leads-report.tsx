// lib/pdf/templates/leads-report.tsx
import React from "react"
import {
    Document,
    Page,
    Text,
    View,
    Image,
} from "@react-pdf/renderer"
import { baseStyles, colors } from "../styles"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// ============================================================
// TIPOS
// ============================================================

interface LeadData {
    id: string
    name: string
    email: string
    company: string | null
    country: string | null
    industry: string | null
    status: string
    source: string
}

interface LeadsReportData {
    workspace: {
        name: string
        logo: string | null
        color: string
    }
    stats: {
        total: number
        new: number
        contacted: number
        interested: number
        converted: number
    }
    byStatus: { status: string; count: number; label: string }[]
    byCountry: { country: string; count: number; flag: string }[]
    byIndustry: { industry: string; count: number }[]
    leads: LeadData[]
    filters: {
        status?: string
        country?: string
        industry?: string
        search?: string
    }
    generatedAt: string
}

// ============================================================
// CONSTANTES
// ============================================================

const STATUS_LABELS: Record<string, string> = {
    NEW: "Novo",
    CONTACTED: "Contatado",
    OPENED: "Abriu Email",
    CLICKED: "Clicou",
    REPLIED: "Respondeu",
    CALLED: "Ligacao Feita",
    INTERESTED: "Interessado",
    NOT_INTERESTED: "Sem Interesse",
    NEGOTIATING: "Negociando",
    CONVERTED: "Convertido",
    UNSUBSCRIBED: "Descadastrado",
    BOUNCED: "Bounced",
}

const SOURCE_LABELS: Record<string, string> = {
    MANUAL: "Manual",
    IMPORT: "Importado",
    MARKETPLACE: "Marketplace",
    WEBSITE: "Website",
    REFERRAL: "Indicacao",
    OTHER: "Outro",
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function MetricCard({
                        value,
                        label,
                        color = colors.dark
                    }: {
    value: number
    label: string
    color?: string
}) {
    return (
        <View style={baseStyles.metricCard}>
            <Text style={[baseStyles.metricValue, { color }]}>{value}</Text>
            <Text style={baseStyles.metricLabel}>{label}</Text>
        </View>
    )
}

function ProgressBar({
                         value,
                         total,
                         label,
                         color
                     }: {
    value: number
    total: number
    label: string
    color: string
}) {
    const percent = total > 0 ? Math.round((value / total) * 100) : 0

    return (
        <View style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                <Text style={{ fontSize: 8, color: colors.dark }}>{label}</Text>
                <Text style={{ fontSize: 8, color: colors.secondary }}>{value} ({percent}%)</Text>
            </View>
            <View style={{ height: 12, backgroundColor: colors.light, borderRadius: 3 }}>
                <View
                    style={{
                        height: "100%",
                        width: `${Math.min(percent, 100)}%`,
                        backgroundColor: color,
                        borderRadius: 3,
                        minWidth: percent > 0 ? 8 : 0,
                    }}
                />
            </View>
        </View>
    )
}

function StatusBadge({ status }: { status: string }) {
    const getStyle = () => {
        switch (status) {
            case "INTERESTED":
            case "CONVERTED":
                return { backgroundColor: "#D1FAE5", color: "#047857" }
            case "NEW":
                return { backgroundColor: "#DBEAFE", color: "#1D4ED8" }
            case "CONTACTED":
            case "OPENED":
            case "CLICKED":
                return { backgroundColor: "#FEF3C7", color: "#B45309" }
            case "NOT_INTERESTED":
            case "UNSUBSCRIBED":
            case "BOUNCED":
                return { backgroundColor: "#FEE2E2", color: "#DC2626" }
            default:
                return { backgroundColor: "#F3F4F6", color: "#374151" }
        }
    }

    const style = getStyle()

    return (
        <View style={[baseStyles.badge, { backgroundColor: style.backgroundColor }]}>
            <Text style={{ color: style.color, fontSize: 7 }}>
                {STATUS_LABELS[status] || status}
            </Text>
        </View>
    )
}

// ============================================================
// PÁGINAS
// ============================================================

function SummaryPage({
                         data,
                         totalPages
                     }: {
    data: LeadsReportData
    totalPages: number
}) {
    const { workspace, stats, byStatus, byCountry, byIndustry, filters, generatedAt } = data

    const initials = workspace.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    const statusColors = [
        colors.primary,
        colors.success,
        colors.warning,
        "#8B5CF6",
        "#EC4899",
        "#6B7280",
    ]

    // Verificar se há filtros ativos
    const hasFilters = filters.status || filters.country || filters.industry || filters.search

    return (
        <Page size="A4" style={baseStyles.page}>
            {/* Header */}
            <View style={baseStyles.header}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    {workspace.logo ? (
                        <Image src={workspace.logo} style={baseStyles.logo} />
                    ) : (
                        <View style={[baseStyles.logoPlaceholder, { backgroundColor: workspace.color }]}>
                            <Text style={baseStyles.logoText}>{initials}</Text>
                        </View>
                    )}
                    <View>
                        <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.dark }}>
                            {workspace.name}
                        </Text>
                        <Text style={{ fontSize: 9, color: colors.secondary }}>
                            Relatorio de Leads
                        </Text>
                    </View>
                </View>
                <View style={baseStyles.headerInfo}>
                    <Text style={baseStyles.headerDate}>
                        Gerado em {format(new Date(generatedAt), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                    </Text>
                </View>
            </View>

            {/* Filtros aplicados */}
            {hasFilters && (
                <View style={{ marginBottom: 15, padding: 10, backgroundColor: colors.light, borderRadius: 6 }}>
                    <Text style={{ fontSize: 9, color: colors.secondary, marginBottom: 4 }}>
                        Filtros aplicados:
                    </Text>
                    <Text style={{ fontSize: 8, color: colors.dark }}>
                        {[
                            filters.status && `Status: ${STATUS_LABELS[filters.status] || filters.status}`,
                            filters.country && `Pais: ${filters.country}`,
                            filters.industry && `Segmento: ${filters.industry}`,
                            filters.search && `Busca: "${filters.search}"`,
                        ].filter(Boolean).join(" | ")}
                    </Text>
                </View>
            )}

            {/* Metrics */}
            <View style={baseStyles.section}>
                <Text style={baseStyles.sectionTitle}>Resumo Geral</Text>
                <View style={baseStyles.metricsGrid}>
                    <MetricCard value={stats.total} label="Total" />
                    <MetricCard value={stats.new} label="Novos" color={colors.primary} />
                    <MetricCard value={stats.contacted} label="Contatados" color={colors.warning} />
                    <MetricCard value={stats.interested} label="Interessados" color={colors.success} />
                    <MetricCard value={stats.converted} label="Convertidos" color="#8B5CF6" />
                </View>
            </View>

            {/* Duas colunas: Status e País */}
            <View style={{ flexDirection: "row", gap: 20, marginBottom: 20 }}>
                {/* Por Status */}
                <View style={{ flex: 1 }}>
                    <Text style={baseStyles.sectionTitle}>Por Status</Text>
                    {byStatus.slice(0, 6).map((item, index) => (
                        <ProgressBar
                            key={item.status}
                            value={item.count}
                            total={stats.total}
                            label={item.label}
                            color={statusColors[index % statusColors.length]}
                        />
                    ))}
                </View>

                {/* Por País */}
                <View style={{ flex: 1 }}>
                    <Text style={baseStyles.sectionTitle}>Por Pais</Text>
                    {byCountry.slice(0, 6).map((item, index) => (
                        <ProgressBar
                            key={item.country}
                            value={item.count}
                            total={stats.total}
                            label={`${item.flag} ${item.country}`}
                            color={statusColors[index % statusColors.length]}
                        />
                    ))}
                    {byCountry.length === 0 && (
                        <Text style={{ fontSize: 9, color: colors.secondary, fontStyle: "italic" }}>
                            Nenhum pais informado
                        </Text>
                    )}
                </View>
            </View>

            {/* Por Segmento */}
            {byIndustry.length > 0 && (
                <View style={baseStyles.section}>
                    <Text style={baseStyles.sectionTitle}>Por Segmento</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {byIndustry.slice(0, 8).map((item) => (
                            <View
                                key={item.industry}
                                style={{
                                    backgroundColor: colors.light,
                                    padding: 8,
                                    borderRadius: 4,
                                    minWidth: 100,
                                }}
                            >
                                <Text style={{ fontSize: 8, color: colors.dark, fontWeight: "bold" }}>
                                    {item.count}
                                </Text>
                                <Text style={{ fontSize: 7, color: colors.secondary }}>
                                    {item.industry.length > 15 ? item.industry.substring(0, 15) + "..." : item.industry}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Footer */}
            <View style={baseStyles.footer}>
                <Text>Gerado por AgencyCRM - agencycrm-nine.vercel.app</Text>
                <Text>Pagina 1 de {totalPages}</Text>
            </View>
        </Page>
    )
}

function LeadsPage({
                       leads,
                       workspace,
                       pageNumber,
                       totalPages,
                       generatedAt,
                   }: {
    leads: LeadData[]
    workspace: LeadsReportData["workspace"]
    pageNumber: number
    totalPages: number
    generatedAt: string
}) {
    const initials = workspace.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return (
        <Page size="A4" style={baseStyles.page}>
            {/* Header compacto */}
            <View style={[baseStyles.header, { marginBottom: 15, paddingBottom: 10 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {workspace.logo ? (
                        <Image src={workspace.logo} style={{ width: 30, height: 30, objectFit: "contain" }} />
                    ) : (
                        <View style={[baseStyles.logoPlaceholder, { backgroundColor: workspace.color, width: 30, height: 30 }]}>
                            <Text style={[baseStyles.logoText, { fontSize: 12 }]}>{initials}</Text>
                        </View>
                    )}
                    <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.dark }}>
                        Lista de Leads
                    </Text>
                </View>
                <Text style={{ fontSize: 8, color: colors.secondary }}>
                    {format(new Date(generatedAt), "dd/MM/yyyy", { locale: ptBR })}
                </Text>
            </View>

            {/* Table */}
            <View style={baseStyles.table}>
                {/* Header */}
                <View style={baseStyles.tableHeader}>
                    <Text style={[baseStyles.tableHeaderCell, { flex: 2 }]}>Nome</Text>
                    <Text style={[baseStyles.tableHeaderCell, { flex: 2 }]}>Empresa</Text>
                    <Text style={[baseStyles.tableHeaderCell, { flex: 1 }]}>Pais</Text>
                    <Text style={[baseStyles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Status</Text>
                    <Text style={[baseStyles.tableHeaderCell, { flex: 1 }]}>Origem</Text>
                </View>

                {/* Rows */}
                {leads.map((lead, index) => (
                    <View
                        key={lead.id}
                        style={[
                            baseStyles.tableRow,
                            index % 2 === 1 ? baseStyles.tableRowAlt : {}
                        ]}
                    >
                        <View style={{ flex: 2 }}>
                            <Text style={[baseStyles.tableCell, { fontWeight: "bold" }]}>
                                {lead.name.length > 20 ? lead.name.substring(0, 20) + "..." : lead.name}
                            </Text>
                            <Text style={[baseStyles.tableCell, { fontSize: 7, color: colors.secondary }]}>
                                {lead.email.length > 25 ? lead.email.substring(0, 25) + "..." : lead.email}
                            </Text>
                        </View>
                        <Text style={[baseStyles.tableCell, { flex: 2 }]}>
                            {lead.company
                                ? (lead.company.length > 18 ? lead.company.substring(0, 18) + "..." : lead.company)
                                : "-"
                            }
                        </Text>
                        <Text style={[baseStyles.tableCell, { flex: 1 }]}>
                            {lead.country || "-"}
                        </Text>
                        <View style={{ flex: 1, alignItems: "center" }}>
                            <StatusBadge status={lead.status} />
                        </View>
                        <Text style={[baseStyles.tableCell, { flex: 1, fontSize: 8 }]}>
                            {SOURCE_LABELS[lead.source] || lead.source}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Footer */}
            <View style={baseStyles.footer}>
                <Text>Gerado por AgencyCRM - agencycrm-nine.vercel.app</Text>
                <Text>Pagina {pageNumber} de {totalPages}</Text>
            </View>
        </Page>
    )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function LeadsReportPDF({ data }: { data: LeadsReportData }) {
    const { leads, workspace, generatedAt } = data

    // Paginação: 25 leads por página
    const LEADS_PER_PAGE = 25
    const leadPages: LeadData[][] = []

    for (let i = 0; i < leads.length; i += LEADS_PER_PAGE) {
        leadPages.push(leads.slice(i, i + LEADS_PER_PAGE))
    }

    const totalPages = 1 + leadPages.length // 1 para resumo + páginas de leads

    return (
        <Document>
            {/* Página de Resumo */}
            <SummaryPage data={data} totalPages={totalPages} />

            {/* Páginas de Leads */}
            {leadPages.map((pageLeads, index) => (
                <LeadsPage
                    key={index}
                    leads={pageLeads}
                    workspace={workspace}
                    pageNumber={index + 2}
                    totalPages={totalPages}
                    generatedAt={generatedAt}
                />
            ))}
        </Document>
    )
}