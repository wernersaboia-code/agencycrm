export type ReportFormat = "pdf" | "csv" | "excel"

const REPORT_EXTENSIONS: Record<ReportFormat, string> = {
    pdf: "pdf",
    csv: "csv",
    excel: "xlsx",
}

function slugifyPart(part: string): string {
    return part
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

export function createReportFileName(parts: string[], format: ReportFormat): string {
    const safeParts = parts.map(slugifyPart).filter(Boolean)
    const date = new Date().toISOString().slice(0, 10)

    return [...safeParts, date].join("-") + `.${REPORT_EXTENSIONS[format]}`
}

export async function downloadResponseBlob(response: Response, fileName: string): Promise<void> {
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
}
