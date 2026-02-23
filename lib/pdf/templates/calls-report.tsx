// lib/pdf/templates/calls-report.tsx
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

interface CallData {
    id: string
    leadName: string
    leadEmail: string
    leadCompany: string | null
    result: string
    duration: number | null
    notes: string | null
    campaignName: string | null
    calledAt: string
}

interface CallsReportData {
    workspace: {
        name: string
        logo: string | null
        color: string
    }
    stats: {
        total: number
        answered: number
        interested: number
        meetingsScheduled: number
        callbacks: number
    }
    byResult: { result: string; count: number; label: string }[]
    byCampaign: { campaign: string; count: number }[]
    calls: CallData[]
    period: {
        start: string | null
        end: string | null
    }
    generatedAt: string
}

// ============================================================
// CONSTANTES
// ============================================================

const RESULT_LABELS: Record<string, string> = {
    ANSWERED: "Atendeu",
    NO_ANSWER: "Nao Atendeu",
    BUSY: "Ocupado",
    VOICEMAIL: "Caixa Postal",
    WRONG_NUMBER: "Numero Errado",
    INTERESTED: "Interessado",
    NOT_INTERESTED: "Sem Interesse",
    CALLBACK: "Retornar",
    MEETING_SCHEDULED: "Reuniao Agendada",
}

const RESULT_COLORS: Record<string, { bg: string; text: string }> = {
    ANSWERED: { bg: "#DBEAFE", text: "#1D4ED8" },
    NO_ANSWER: { bg: "#FEE2E2", text: "#DC2626" },
    BUSY: { bg: "#FEF3C7", text: "#B45309" },
    VOICEMAIL: { bg: "#F3F4F6", text: "#374151" },
    WRONG_NUMBER: { bg: "#FEE2E2", text: "#DC2626" },
    INTERESTED: { bg: "#D1FAE5", text: "#047857" },
    NOT_INTERESTED: { bg: "#FEE2E2", text: "#DC2626" },
    CALLBACK: { bg: "#E0E7FF", text: "#4338CA" },
    MEETING_SCHEDULED: { bg: "#D1FAE5", text: "#047857" },
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function MetricCard({
                        value,
                        label,
                        percent,
                        color = colors.dark
                    }: {
    value: number
    label: string
    percent?: string
    color?: string
}) {
    return (
        <View style={baseStyles.metricCard}>
            <Text style={[baseStyles.metricValue, { color }]}>{value}</Text>
            <Text style={baseStyles.metricLabel}>{label}</Text>
            {percent && (
                <Text style={[baseStyles.metricPercent, { color }]}>{percent}</Text>
            )}
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

function ResultBadge({ result }: { result: string }) {
    const style = RESULT_COLORS[result] || { bg: "#F3F4F6", text: "#374151" }

    return (
        <View style={[baseStyles.badge, { backgroundColor: style.bg }]}>
            <Text style={{ color: style.text, fontSize: 7 }}>
                {RESULT_LABELS[result] || result}
            </Text>
        </View>
    )
}

function formatDuration(seconds: number | null): string {
    if (!seconds) return "-"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
}

// ============================================================
// PÁGINAS
// ============================================================

function SummaryPage({
                         data,
                         totalPages
                     }: {
    data: CallsReportData
    totalPages: number
}) {
    const { workspace, stats, byResult, byCampaign, period, generatedAt } = data

    const initials = workspace.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    const resultColors = [
        colors.success,
        colors.primary,
        colors.warning,
        "#8B5CF6",
        "#EC4899",
        colors.danger,
    ]

    const answeredRate = stats.total > 0
        ? ((stats.answered / stats.total) * 100).toFixed(1)
        : "0"

    const interestedRate = stats.answered > 0
        ? ((stats.interested / stats.answered) * 100).toFixed(1)
        : "0"

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
                            Relatorio de Ligacoes
                        </Text>
                    </View>
                </View>
                <View style={baseStyles.headerInfo}>
                    <Text style={baseStyles.headerDate}>
                        Gerado em {format(new Date(generatedAt), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                    </Text>
                    {(period.start || period.end) && (
                        <Text style={[baseStyles.headerDate, { marginTop: 2 }]}>
                            Periodo: {period.start || "Inicio"} a {period.end || "Hoje"}
                        </Text>
                    )}
                </View>
            </View>

            {/* Metrics */}
            <View style={baseStyles.section}>
                <Text style={baseStyles.sectionTitle}>Resumo Geral</Text>
                <View style={baseStyles.metricsGrid}>
                    <MetricCard value={stats.total} label="Total" />
                    <MetricCard
                        value={stats.answered}
                        label="Atendidas"
                        percent={`${answeredRate}%`}
                        color={colors.primary}
                    />
                    <MetricCard
                        value={stats.interested}
                        label="Interessados"
                        percent={`${interestedRate}%`}
                        color={colors.success}
                    />
                    <MetricCard
                        value={stats.meetingsScheduled}
                        label="Reunioes"
                        color="#8B5CF6"
                    />
                    <MetricCard
                        value={stats.callbacks}
                        label="Callbacks"
                        color={colors.warning}
                    />
                </View>
            </View>

            {/* Duas colunas: Resultados e Campanhas */}
            <View style={{ flexDirection: "row", gap: 20, marginBottom: 20 }}>
                {/* Por Resultado */}
                <View style={{ flex: 1 }}>
                    <Text style={baseStyles.sectionTitle}>Por Resultado</Text>
                    {byResult.slice(0, 8).map((item, index) => (
                        <ProgressBar
                            key={item.result}
                            value={item.count}
                            total={stats.total}
                            label={item.label}
                            color={resultColors[index % resultColors.length]}
                        />
                    ))}
                </View>

                {/* Por Campanha */}
                <View style={{ flex: 1 }}>
                    <Text style={baseStyles.sectionTitle}>Por Campanha</Text>
                    {byCampaign.length > 0 ? (
                        byCampaign.slice(0, 6).map((item, index) => (
                            <ProgressBar
                                key={item.campaign}
                                value={item.count}
                                total={stats.total}
                                label={item.campaign.length > 20 ? item.campaign.substring(0, 20) + "..." : item.campaign}
                                color={resultColors[index % resultColors.length]}
                            />
                        ))
                    ) : (
                        <Text style={{ fontSize: 9, color: colors.secondary, fontStyle: "italic" }}>
                            Nenhuma campanha vinculada
                        </Text>
                    )}
                </View>
            </View>

            {/* Footer */}
            <View style={baseStyles.footer}>
                <Text>Gerado por AgencyCRM - agencycrm-nine.vercel.app</Text>
                <Text>Pagina 1 de {totalPages}</Text>
            </View>
        </Page>
    )
}

function CallsPage({
                       calls,
                       workspace,
                       pageNumber,
                       totalPages,
                       generatedAt,
                   }: {
    calls: CallData[]
    workspace: CallsReportData["workspace"]
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
                        Historico de Ligacoes
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
                    <Text style={[baseStyles.tableHeaderCell, { flex: 2 }]}>Lead</Text>
                    <Text style={[baseStyles.tableHeaderCell, { flex: 1.5 }]}>Empresa</Text>
                    <Text style={[baseStyles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Resultado</Text>
                    <Text style={[baseStyles.tableHeaderCell, { flex: 0.7, textAlign: "center" }]}>Duracao</Text>
                    <Text style={[baseStyles.tableHeaderCell, { flex: 1 }]}>Data</Text>
                </View>

                {/* Rows */}
                {calls.map((call, index) => (
                    <View
                        key={call.id}
                        style={[
                            baseStyles.tableRow,
                            index % 2 === 1 ? baseStyles.tableRowAlt : {}
                        ]}
                    >
                        <View style={{ flex: 2 }}>
                            <Text style={[baseStyles.tableCell, { fontWeight: "bold" }]}>
                                {call.leadName.length > 18 ? call.leadName.substring(0, 18) + "..." : call.leadName}
                            </Text>
                            <Text style={[baseStyles.tableCell, { fontSize: 7, color: colors.secondary }]}>
                                {call.leadEmail.length > 22 ? call.leadEmail.substring(0, 22) + "..." : call.leadEmail}
                            </Text>
                        </View>
                        <Text style={[baseStyles.tableCell, { flex: 1.5 }]}>
                            {call.leadCompany
                                ? (call.leadCompany.length > 15 ? call.leadCompany.substring(0, 15) + "..." : call.leadCompany)
                                : "-"
                            }
                        </Text>
                        <View style={{ flex: 1, alignItems: "center" }}>
                            <ResultBadge result={call.result} />
                        </View>
                        <Text style={[baseStyles.tableCell, { flex: 0.7, textAlign: "center" }]}>
                            {formatDuration(call.duration)}
                        </Text>
                        <Text style={[baseStyles.tableCell, { flex: 1, fontSize: 8 }]}>
                            {format(new Date(call.calledAt), "dd/MM/yy HH:mm", { locale: ptBR })}
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

export function CallsReportPDF({ data }: { data: CallsReportData }) {
    const { calls, workspace, generatedAt } = data

    // Paginação: 20 ligações por página
    const CALLS_PER_PAGE = 20
    const callPages: CallData[][] = []

    for (let i = 0; i < calls.length; i += CALLS_PER_PAGE) {
        callPages.push(calls.slice(i, i + CALLS_PER_PAGE))
    }

    const totalPages = 1 + callPages.length // 1 para resumo + páginas de calls

    return (
        <Document>
            {/* Página de Resumo */}
            <SummaryPage data={data} totalPages={totalPages} />

            {/* Páginas de Ligações */}
            {callPages.map((pageCalls, index) => (
                <CallsPage
                    key={index}
                    calls={pageCalls}
                    workspace={workspace}
                    pageNumber={index + 2}
                    totalPages={totalPages}
                    generatedAt={generatedAt}
                />
            ))}
        </Document>
    )
}