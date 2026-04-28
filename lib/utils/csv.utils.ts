const FORMULA_PREFIX_PATTERN = /^[=+\-@\t\r]/

export function escapeCsvValue(value: string): string {
    const safeValue = FORMULA_PREFIX_PATTERN.test(value) ? `'${value}` : value

    if (safeValue.includes(",") || safeValue.includes('"') || safeValue.includes("\n")) {
        return `"${safeValue.replace(/"/g, '""')}"`
    }

    return safeValue
}

export function buildCsv(headers: string[], rows: string[][]): string {
    return [
        headers.map(escapeCsvValue).join(","),
        ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n")
}

export function sanitizeCsvFilenameSegment(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        || "export"
}
