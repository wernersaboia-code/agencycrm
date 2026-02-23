// lib/pdf/templates/executive-report.tsx
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

interface ExecutiveReportData {
    workspace: {
        name: string
        logo: string | null
        color: string
    }
    period: {
        start: string
        end: string
    }
    leads: {
        total: number
        new: number
        contacted: number
        interested: number
        converted: number
        byStatus: { status: string; count: number; label: string }[]
        byCountry: { country: string; count: number }[]
        byIndustry: { industry: string; count: number }[]
    }
    campaigns: {
        total: number
        sent: number
        totalEmails: number
        totalOpened: number
        totalClicked: number
        openRate: number
        clickRate: number
        topCampaigns: {
            name: string
            sent: number
            opened: number
            clicked: number
            openRate: number
        }[]
    }
    calls: {
        total: number
        answered: number
        interested: number
        meetingsScheduled: number
        answerRate: number
        conversionRate: number
        byResult: { result: string; count: number; label: string }[]
    }
    generatedAt: string
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function MetricCard({
                        value,
                        label,
                        subtitle,
                        color = colors.dark
                    }: {
    value: string | number
    label: string
    subtitle?: string
    color?: string
}) {
    return (
        <View style={{
            flex: 1,
            padding: 12,
            backgroundColor: colors.light,
            borderRadius: 6,
            alignItems: "center",
        }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color }}>{value}</Text>
            <Text style={{ fontSize: 8, color: colors.secondary, marginTop: 2 }}>{label}</Text>
            {subtitle && (
                <Text style={{ fontSize: 7, color, marginTop: 1 }}>{subtitle}</Text>
            )}
        </View>
    )
}

function ProgressBar({
                         value,
                         total,
                         label,
                         color,
                         showPercent = true,
                     }: {
    value: number
    total: number
    label: string
    color: string
    showPercent?: boolean
}) {
    const percent = total > 0 ? Math.round((value / total) * 100) : 0

    return (
        <View style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                <Text style={{ fontSize: 8, color: colors.dark }}>{label}</Text>
                <Text style={{ fontSize: 8, color: colors.secondary }}>
                    {value}{showPercent ? ` (${percent}%)` : ""}
                </Text>
            </View>
            <View style={{ height: 8, backgroundColor: "#E5E7EB", borderRadius: 4 }}>
                <View
                    style={{
                        height: "100%",
                        width: `${Math.min(percent, 100)}%`,
                        backgroundColor: color,
                        borderRadius: 4,
                        minWidth: percent > 0 ? 6 : 0,
                    }}
                />
            </View>
        </View>
    )
}

function SectionTitle({ children }: { children: string }) {
    return (
        <Text style={{
            fontSize: 14,
            fontWeight: "bold",
            color: colors.dark,
            marginBottom: 12,
            marginTop: 8,
            paddingBottom: 6,
            borderBottomWidth: 2,
            borderBottomColor: colors.primary,
        }}>
            {children}
        </Text>
    )
}

// ============================================================
// PÁGINAS
// ============================================================

function CoverPage({ data }: { data: ExecutiveReportData }) {
    const { workspace, period, generatedAt } = data

    const initials = workspace.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return (
        <Page size="A4" style={[baseStyles.page, { justifyContent: "center", alignItems: "center" }]}>
            {/* Logo */}
            <View style={{ alignItems: "center", marginBottom: 40 }}>
                {workspace.logo ? (
                    <Image src={workspace.logo} style={{ width: 120, height: 120, objectFit: "contain" }} />
                ) : (
                    <View style={{
                        width: 120,
                        height: 120,
                        backgroundColor: workspace.color,
                        borderRadius: 16,
                        justifyContent: "center",
                        alignItems: "center",
                    }}>
                        <Text style={{ fontSize: 48, fontWeight: "bold", color: colors.white }}>{initials}</Text>
                    </View>
                )}
            </View>

            {/* Título */}
            <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.dark, marginBottom: 8 }}>
                Relatorio Executivo
            </Text>
            <Text style={{ fontSize: 18, color: colors.secondary, marginBottom: 40 }}>
                {workspace.name}
            </Text>

            {/* Período */}
            <View style={{
                backgroundColor: colors.light,
                padding: 20,
                borderRadius: 8,
                alignItems: "center",
            }}>
                <Text style={{ fontSize: 10, color: colors.secondary, marginBottom: 4 }}>
                    Periodo
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.dark }}>
                    {format(new Date(period.start), "dd/MM/yyyy")} a {format(new Date(period.end), "dd/MM/yyyy")}
                </Text>
            </View>

            {/* Footer */}
            <View style={{ position: "absolute", bottom: 40 }}>
                <Text style={{ fontSize: 9, color: colors.secondary, textAlign: "center" }}>
                    Gerado em {format(new Date(generatedAt), "dd 'de' MMMM 'de' yyyy 'as' HH:mm", { locale: ptBR })}
                </Text>
                <Text style={{ fontSize: 8, color: colors.secondary, textAlign: "center", marginTop: 4 }}>
                    AgencyCRM - agencycrm-nine.vercel.app
                </Text>
            </View>
        </Page>
    )
}

function SummaryPage({ data }: { data: ExecutiveReportData }) {
    const { workspace, leads, campaigns, calls, period, generatedAt } = data

    const initials = workspace.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return (
        <Page size="A4" style={baseStyles.page}>
            {/* Header */}
            <View style={baseStyles.header}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    {workspace.logo ? (
                        <Image src={workspace.logo} style={{ width: 40, height: 40, objectFit: "contain" }} />
                    ) : (
                        <View style={[baseStyles.logoPlaceholder, { backgroundColor: workspace.color, width: 40, height: 40 }]}>
                            <Text style={[baseStyles.logoText, { fontSize: 14 }]}>{initials}</Text>
                        </View>
                    )}
                    <View>
                        <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.dark }}>
                            {workspace.name}
                        </Text>
                        <Text style={{ fontSize: 8, color: colors.secondary }}>
                            {format(new Date(period.start), "dd/MM")} - {format(new Date(period.end), "dd/MM/yyyy")}
                        </Text>
                    </View>
                </View>
                <Text style={{ fontSize: 8, color: colors.secondary }}>
                    Pagina 2
                </Text>
            </View>

            {/* Resumo Geral */}
            <SectionTitle>Resumo do Periodo</SectionTitle>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                <MetricCard value={leads.total} label="Total de Leads" />
                <MetricCard value={campaigns.totalEmails} label="Emails Enviados" />
                <MetricCard value={calls.total} label="Ligacoes" />
                <MetricCard
                    value={leads.converted}
                    label="Convertidos"
                    color={colors.success}
                />
            </View>

            {/* Leads */}
            <SectionTitle>Leads</SectionTitle>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 15 }}>
                <MetricCard value={leads.new} label="Novos" color={colors.primary} />
                <MetricCard value={leads.contacted} label="Contatados" color={colors.warning} />
                <MetricCard value={leads.interested} label="Interessados" color={colors.success} />
                <MetricCard value={leads.converted} label="Convertidos" color="#8B5CF6" />
            </View>

            <View style={{ flexDirection: "row", gap: 20 }}>
                {/* Por Status */}
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, fontWeight: "bold", color: colors.dark, marginBottom: 8 }}>
                        Por Status
                    </Text>
                    {leads.byStatus.slice(0, 5).map((item, index) => (
                        <ProgressBar
                            key={item.status}
                            value={item.count}
                            total={leads.total}
                            label={item.label}
                            color={[colors.primary, colors.success, colors.warning, "#8B5CF6", "#EC4899"][index % 5]}
                        />
                    ))}
                </View>

                {/* Por País */}
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9, fontWeight: "bold", color: colors.dark, marginBottom: 8 }}>
                        Por Pais
                    </Text>
                    {leads.byCountry.length > 0 ? (
                        leads.byCountry.slice(0, 5).map((item, index) => (
                            <ProgressBar
                                key={item.country}
                                value={item.count}
                                total={leads.total}
                                label={item.country}
                                color={[colors.primary, colors.success, colors.warning, "#8B5CF6", "#EC4899"][index % 5]}
                            />
                        ))
                    ) : (
                        <Text style={{ fontSize: 8, color: colors.secondary, fontStyle: "italic" }}>
                            Nenhum pais informado
                        </Text>
                    )}
                </View>
            </View>

            {/* Footer */}
            <View style={baseStyles.footer}>
                <Text>Gerado por AgencyCRM</Text>
                <Text>Pagina 2</Text>
            </View>
        </Page>
    )
}

function CampaignsPage({ data }: { data: ExecutiveReportData }) {
    const { workspace, campaigns, period } = data

    const initials = workspace.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return (
        <Page size="A4" style={baseStyles.page}>
            {/* Header */}
            <View style={baseStyles.header}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    {workspace.logo ? (
                        <Image src={workspace.logo} style={{ width: 40, height: 40, objectFit: "contain" }} />
                    ) : (
                        <View style={[baseStyles.logoPlaceholder, { backgroundColor: workspace.color, width: 40, height: 40 }]}>
                            <Text style={[baseStyles.logoText, { fontSize: 14 }]}>{initials}</Text>
                        </View>
                    )}
                    <View>
                        <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.dark }}>
                            Campanhas de Email
                        </Text>
                        <Text style={{ fontSize: 8, color: colors.secondary }}>
                            {format(new Date(period.start), "dd/MM")} - {format(new Date(period.end), "dd/MM/yyyy")}
                        </Text>
                    </View>
                </View>
                <Text style={{ fontSize: 8, color: colors.secondary }}>
                    Pagina 3
                </Text>
            </View>

            {/* Métricas de Email */}
            <SectionTitle>Performance de Email</SectionTitle>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                <MetricCard value={campaigns.total} label="Campanhas" />
                <MetricCard value={campaigns.totalEmails} label="Emails Enviados" />
                <MetricCard
                    value={campaigns.totalOpened}
                    label="Abertos"
                    subtitle={`${campaigns.openRate.toFixed(1)}%`}
                    color={colors.success}
                />
                <MetricCard
                    value={campaigns.totalClicked}
                    label="Clicados"
                    subtitle={`${campaigns.clickRate.toFixed(1)}%`}
                    color={colors.warning}
                />
            </View>

            {/* Barras de Performance */}
            <View style={{ marginBottom: 20 }}>
                <ProgressBar
                    value={campaigns.totalOpened}
                    total={campaigns.totalEmails}
                    label="Taxa de Abertura"
                    color={colors.success}
                />
                <ProgressBar
                    value={campaigns.totalClicked}
                    total={campaigns.totalEmails}
                    label="Taxa de Cliques"
                    color={colors.warning}
                />
            </View>

            {/* Top Campanhas */}
            {campaigns.topCampaigns.length > 0 && (
                <>
                    <Text style={{ fontSize: 10, fontWeight: "bold", color: colors.dark, marginBottom: 10 }}>
                        Melhores Campanhas
                    </Text>

                    <View style={baseStyles.table}>
                        <View style={baseStyles.tableHeader}>
                            <Text style={[baseStyles.tableHeaderCell, { flex: 3 }]}>Campanha</Text>
                            <Text style={[baseStyles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Enviados</Text>
                            <Text style={[baseStyles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Abertos</Text>
                            <Text style={[baseStyles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Clicados</Text>
                            <Text style={[baseStyles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Taxa</Text>
                        </View>

                        {campaigns.topCampaigns.slice(0, 8).map((campaign, index) => (
                            <View
                                key={index}
                                style={[
                                    baseStyles.tableRow,
                                    index % 2 === 1 ? baseStyles.tableRowAlt : {}
                                ]}
                            >
                                <Text style={[baseStyles.tableCell, { flex: 3 }]}>
                                    {campaign.name.length > 30 ? campaign.name.substring(0, 30) + "..." : campaign.name}
                                </Text>
                                <Text style={[baseStyles.tableCell, { flex: 1, textAlign: "center" }]}>
                                    {campaign.sent}
                                </Text>
                                <Text style={[baseStyles.tableCell, { flex: 1, textAlign: "center" }]}>
                                    {campaign.opened}
                                </Text>
                                <Text style={[baseStyles.tableCell, { flex: 1, textAlign: "center" }]}>
                                    {campaign.clicked}
                                </Text>
                                <Text style={[baseStyles.tableCell, { flex: 1, textAlign: "center", color: colors.success }]}>
                                    {campaign.openRate.toFixed(0)}%
                                </Text>
                            </View>
                        ))}
                    </View>
                </>
            )}

            {/* Footer */}
            <View style={baseStyles.footer}>
                <Text>Gerado por AgencyCRM</Text>
                <Text>Pagina 3</Text>
            </View>
        </Page>
    )
}

function CallsPage({ data }: { data: ExecutiveReportData }) {
    const { workspace, calls, period } = data

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

    return (
        <Page size="A4" style={baseStyles.page}>
            {/* Header */}
            <View style={baseStyles.header}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    {workspace.logo ? (
                        <Image src={workspace.logo} style={{ width: 40, height: 40, objectFit: "contain" }} />
                    ) : (
                        <View style={[baseStyles.logoPlaceholder, { backgroundColor: workspace.color, width: 40, height: 40 }]}>
                            <Text style={[baseStyles.logoText, { fontSize: 14 }]}>{initials}</Text>
                        </View>
                    )}
                    <View>
                        <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.dark }}>
                            Ligacoes
                        </Text>
                        <Text style={{ fontSize: 8, color: colors.secondary }}>
                            {format(new Date(period.start), "dd/MM")} - {format(new Date(period.end), "dd/MM/yyyy")}
                        </Text>
                    </View>
                </View>
                <Text style={{ fontSize: 8, color: colors.secondary }}>
                    Pagina 4
                </Text>
            </View>

            {/* Métricas de Ligações */}
            <SectionTitle>Performance de Ligacoes</SectionTitle>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                <MetricCard value={calls.total} label="Total" />
                <MetricCard
                    value={calls.answered}
                    label="Atendidas"
                    subtitle={`${calls.answerRate.toFixed(0)}%`}
                    color={colors.primary}
                />
                <MetricCard
                    value={calls.interested}
                    label="Interessados"
                    subtitle={`${calls.conversionRate.toFixed(0)}%`}
                    color={colors.success}
                />
                <MetricCard
                    value={calls.meetingsScheduled}
                    label="Reunioes"
                    color="#8B5CF6"
                />
            </View>

            {/* Por Resultado */}
            <Text style={{ fontSize: 10, fontWeight: "bold", color: colors.dark, marginBottom: 10 }}>
                Distribuicao por Resultado
            </Text>

            <View style={{ flexDirection: "row", gap: 20 }}>
                <View style={{ flex: 1 }}>
                    {calls.byResult.slice(0, 5).map((item, index) => (
                        <ProgressBar
                            key={item.result}
                            value={item.count}
                            total={calls.total}
                            label={item.label}
                            color={resultColors[index % resultColors.length]}
                        />
                    ))}
                </View>
                <View style={{ flex: 1 }}>
                    {calls.byResult.slice(5, 10).map((item, index) => (
                        <ProgressBar
                            key={item.result}
                            value={item.count}
                            total={calls.total}
                            label={item.label}
                            color={resultColors[(index + 5) % resultColors.length]}
                        />
                    ))}
                </View>
            </View>

            {/* Conclusão */}
            <View style={{
                marginTop: 30,
                padding: 15,
                backgroundColor: colors.light,
                borderRadius: 8,
                borderLeftWidth: 4,
                borderLeftColor: colors.primary,
            }}>
                <Text style={{ fontSize: 10, fontWeight: "bold", color: colors.dark, marginBottom: 6 }}>
                    Resumo do Periodo
                </Text>
                <Text style={{ fontSize: 9, color: colors.secondary, lineHeight: 1.5 }}>
                    No periodo analisado, foram realizadas {calls.total} ligacoes com taxa de atendimento de {calls.answerRate.toFixed(0)}%.
                    {calls.interested > 0 && ` Foram identificados ${calls.interested} leads interessados`}
                    {calls.meetingsScheduled > 0 && ` e ${calls.meetingsScheduled} reunioes foram agendadas`}.
                </Text>
            </View>

            {/* Footer */}
            <View style={baseStyles.footer}>
                <Text>Gerado por AgencyCRM</Text>
                <Text>Pagina 4</Text>
            </View>
        </Page>
    )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function ExecutiveReportPDF({ data }: { data: ExecutiveReportData }) {
    return (
        <Document>
            <CoverPage data={data} />
            <SummaryPage data={data} />
            <CampaignsPage data={data} />
            <CallsPage data={data} />
        </Document>
    )
}