// lib/pdf/styles.ts
import { StyleSheet } from "@react-pdf/renderer"

export const colors = {
    primary: "#3B82F6",
    secondary: "#6B7280",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    dark: "#1F2937",
    light: "#F3F4F6",
    white: "#FFFFFF",
    border: "#E5E7EB",
}

export const baseStyles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: colors.dark,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: colors.border,
    },
    logo: {
        width: 60,
        height: 60,
        objectFit: "contain",
    },
    logoPlaceholder: {
        width: 60,
        height: 60,
        backgroundColor: colors.primary,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    logoText: {
        color: colors.white,
        fontSize: 20,
        fontWeight: "bold",
    },
    headerInfo: {
        textAlign: "right",
    },
    headerDate: {
        fontSize: 9,
        color: colors.secondary,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: colors.dark,
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: colors.secondary,
        textAlign: "center",
        marginBottom: 30,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: colors.dark,
        marginBottom: 12,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    metricsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    metricCard: {
        flex: 1,
        padding: 15,
        backgroundColor: colors.light,
        borderRadius: 8,
        alignItems: "center",
    },
    metricValue: {
        fontSize: 22,
        fontWeight: "bold",
        color: colors.dark,
    },
    metricLabel: {
        fontSize: 9,
        color: colors.secondary,
        marginTop: 4,
    },
    metricPercent: {
        fontSize: 10,
        color: colors.success,
        marginTop: 2,
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: colors.dark,
        padding: 10,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
    },
    tableHeaderCell: {
        color: colors.white,
        fontSize: 9,
        fontWeight: "bold",
    },
    tableRow: {
        flexDirection: "row",
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tableRowAlt: {
        backgroundColor: colors.light,
    },
    tableCell: {
        fontSize: 9,
        color: colors.dark,
    },
    progressBarContainer: {
        height: 20,
        backgroundColor: colors.light,
        borderRadius: 4,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
    },
    progressBar: {
        height: "100%",
        borderRadius: 4,
    },
    progressLabel: {
        position: "absolute",
        right: 8,
        fontSize: 9,
        color: colors.dark,
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        fontSize: 8,
        color: colors.secondary,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        fontSize: 8,
    },
    badgeSent: {
        backgroundColor: "#DBEAFE",
        color: "#1D4ED8",
    },
    badgeOpened: {
        backgroundColor: "#D1FAE5",
        color: "#047857",
    },
    badgeClicked: {
        backgroundColor: "#FEF3C7",
        color: "#B45309",
    },
    badgeBounced: {
        backgroundColor: "#FEE2E2",
        color: "#DC2626",
    },
})