// lib/pdf/templates/campaign-report.tsx
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

interface EmailSendData {
    id: string
    leadName: string
    leadEmail: string
    status: string
    openCount: number
    clickCount: number
    sentAt: string | null
    openedAt: string | null
    clickedAt: string | null
}

interface CampaignReportData {
    campaign: {
        id: string
        name: string
        subject: string | null
        status: string
        sentAt: string | null
        createdAt: string
        totalRecipients: number
        totalSent: number
        totalOpened: number
        totalClicked: number
        totalReplied: number
        totalBounced: number
    }
    workspace: {
        name: string
        logo: string | null
        color: string
    }
    sends: EmailSendData[]
    generatedAt: string
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
        <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 9, color: colors.dark }}>{label}</Text>
                <Text style={{ fontSize: 9, color: colors.secondary }}>{value} ({percent}%)</Text>
            </View>
            <View style={baseStyles.progressBarContainer}>
                <View
                    style={[
                        baseStyles.progressBar,
                        {
                            width: `${percent}%`,
                            backgroundColor: color,
                            minWidth: percent > 0 ? 10 : 0,
                        }
                    ]}
                />
            </View>
        </View>
    )
}

function StatusBadge({ status }: { status: string }) {
    const getStyle = () => {
        switch (status) {
            case "OPENED":
            case "DELIVERED":
                return baseStyles.badgeOpened
            case "CLICKED":
            case "REPLIED":
                return baseStyles.badgeClicked
            case "BOUNCED":
            case "COMPLAINED":
                return baseStyles.badgeBounced
            default:
                return baseStyles.badgeSent
        }
    }

    const getLabel = () => {
        switch (status) {
            case "PENDING": return "Pendente"
            case "SENT": return "Enviado"
            case "DELIVERED": return "Entregue"
            case "OPENED": return "Aberto"
            case "CLICKED": return "Clicado"
            case "REPLIED": return "Respondido"
            case "BOUNCED": return "Bounced"
            case "COMPLAINED": return "Spam"
            default: return status
        }
    }

    return (
        <View style={[baseStyles.badge, getStyle()]}>
            <Text>{getLabel()}</Text>
        </View>
    )
}

// Componente para renderizar uma página de envios
function SendsPage({
                       sends,
                       startIndex,
                       isFirstPage,
                       workspace,
                       campaign,
                       generatedAt,
                       totalPages,
                       currentPage,
                   }: {
    sends: EmailSendData[]
    startIndex: number
    isFirstPage: boolean
    workspace: CampaignReportData["workspace"]
    campaign: CampaignReportData["campaign"]
    generatedAt: string
    totalPages: number
    currentPage: number
}) {
    const initials = workspace.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    const openRate = campaign.totalSent > 0
        ? ((campaign.totalOpened / campaign.totalSent) * 100).toFixed(1)
        : "0"

    const clickRate = campaign.totalSent > 0
        ? ((campaign.totalClicked / campaign.totalSent) * 100).toFixed(1)
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
                            Relatorio de Campanha
                        </Text>
                    </View>
                </View>
                <View style={baseStyles.headerInfo}>
                    <Text style={baseStyles.headerDate}>
                        Gerado em {format(new Date(generatedAt), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                    </Text>
                </View>
            </View>

            {/* Conteúdo da primeira página */}
            {isFirstPage && (
                <>
                    {/* Title */}
                    <Text style={baseStyles.title}>{campaign.name}</Text>

                    {/* Metrics */}
                    <View style={baseStyles.section}>
                        <Text style={baseStyles.sectionTitle}>Resumo Executivo</Text>
                        <View style={baseStyles.metricsGrid}>
                            <MetricCard
                                value={campaign.totalSent}
                                label="Enviados"
                            />
                            <MetricCard
                                value={campaign.totalOpened}
                                label="Abertos"
                                percent={`${openRate}%`}
                                color={colors.success}
                            />
                            <MetricCard
                                value={campaign.totalClicked}
                                label="Clicados"
                                percent={`${clickRate}%`}
                                color={colors.warning}
                            />
                            <MetricCard
                                value={campaign.totalReplied}
                                label="Respondidos"
                            />
                            <MetricCard
                                value={campaign.totalBounced}
                                label="Bounces"
                                color={campaign.totalBounced > 0 ? colors.danger : colors.dark}
                            />
                        </View>
                    </View>

                    {/* Performance */}
                    <View style={baseStyles.section}>
                        <Text style={baseStyles.sectionTitle}>Performance</Text>
                        <ProgressBar
                            value={campaign.totalOpened}
                            total={campaign.totalSent}
                            label="Taxa de Abertura"
                            color={colors.success}
                        />
                        <ProgressBar
                            value={campaign.totalClicked}
                            total={campaign.totalSent}
                            label="Taxa de Cliques"
                            color={colors.warning}
                        />
                        <ProgressBar
                            value={campaign.totalReplied}
                            total={campaign.totalSent}
                            label="Taxa de Resposta"
                            color={colors.primary}
                        />
                    </View>
                </>
            )}

            {/* Table Section */}
            <View style={baseStyles.section}>
                {isFirstPage && (
                    <Text style={baseStyles.sectionTitle}>Detalhamento dos Envios</Text>
                )}
                {!isFirstPage && (
                    <Text style={[baseStyles.sectionTitle, { marginTop: 0 }]}>
                        Detalhamento dos Envios (continuacao)
                    </Text>
                )}

                <View style={baseStyles.table}>
                    {/* Header */}
                    <View style={baseStyles.tableHeader}>
                        <Text style={[baseStyles.tableHeaderCell, { flex: 2 }]}>Lead</Text>
                        <Text style={[baseStyles.tableHeaderCell, { flex: 2 }]}>Email</Text>
                        <Text style={[baseStyles.tableHeaderCell, { flex: 1, textAlign: "center" }]}>Status</Text>
                        <Text style={[baseStyles.tableHeaderCell, { flex: 0.5, textAlign: "center" }]}>Abert.</Text>
                        <Text style={[baseStyles.tableHeaderCell, { flex: 0.5, textAlign: "center" }]}>Cliques</Text>
                    </View>

                    {/* Rows */}
                    {sends.map((send, index) => (
                        <View
                            key={send.id}
                            style={[
                                baseStyles.tableRow,
                                index % 2 === 1 ? baseStyles.tableRowAlt : {}
                            ]}
                        >
                            <Text style={[baseStyles.tableCell, { flex: 2 }]}>
                                {send.leadName.length > 25 ? send.leadName.substring(0, 25) + "..." : send.leadName}
                            </Text>
                            <Text style={[baseStyles.tableCell, { flex: 2 }]}>
                                {send.leadEmail.length > 30 ? send.leadEmail.substring(0, 30) + "..." : send.leadEmail}
                            </Text>
                            <View style={{ flex: 1, alignItems: "center" }}>
                                <StatusBadge status={send.status} />
                            </View>
                            <Text style={[baseStyles.tableCell, { flex: 0.5, textAlign: "center" }]}>
                                {send.openCount}
                            </Text>
                            <Text style={[baseStyles.tableCell, { flex: 0.5, textAlign: "center" }]}>
                                {send.clickCount}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Footer */}
            <View style={baseStyles.footer}>
                <Text>Gerado por AgencyCRM - agencycrm-nine.vercel.app</Text>
                <Text>Pagina {currentPage} de {totalPages}</Text>
            </View>
        </Page>
    )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function CampaignReportPDF({ data }: { data: CampaignReportData }) {
    const { campaign, workspace, sends, generatedAt } = data

    // Calcular paginação
    // Primeira página: ~15 envios (por causa das métricas)
    // Páginas seguintes: ~25 envios
    const FIRST_PAGE_LIMIT = 15
    const OTHER_PAGES_LIMIT = 25

    const pages: { sends: EmailSendData[]; startIndex: number; isFirstPage: boolean }[] = []

    if (sends.length <= FIRST_PAGE_LIMIT) {
        // Tudo cabe na primeira página
        pages.push({ sends, startIndex: 0, isFirstPage: true })
    } else {
        // Primeira página
        pages.push({
            sends: sends.slice(0, FIRST_PAGE_LIMIT),
            startIndex: 0,
            isFirstPage: true
        })

        // Páginas seguintes
        let currentIndex = FIRST_PAGE_LIMIT
        while (currentIndex < sends.length) {
            const pageSends = sends.slice(currentIndex, currentIndex + OTHER_PAGES_LIMIT)
            pages.push({
                sends: pageSends,
                startIndex: currentIndex,
                isFirstPage: false
            })
            currentIndex += OTHER_PAGES_LIMIT
        }
    }

    return (
        <Document>
            {pages.map((page, pageIndex) => (
                <SendsPage
                    key={pageIndex}
                    sends={page.sends}
                    startIndex={page.startIndex}
                    isFirstPage={page.isFirstPage}
                    workspace={workspace}
                    campaign={campaign}
                    generatedAt={generatedAt}
                    totalPages={pages.length}
                    currentPage={pageIndex + 1}
                />
            ))}
        </Document>
    )
}