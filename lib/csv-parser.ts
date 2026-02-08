// lib/csv-parser.ts

import Papa from 'papaparse'

export interface ParsedCSV {
    headers: string[]
    rows: Record<string, string>[]
    totalRows: number
    errors: Papa.ParseError[]
}

export interface ParseOptions {
    encoding?: string
    delimiter?: string
    skipEmptyLines?: boolean
}

/**
 * Faz parse de um arquivo CSV
 */
export function parseCSVFile(
    file: File,
    options: ParseOptions = {}
): Promise<ParsedCSV> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: options.skipEmptyLines ?? true,
            encoding: options.encoding ?? 'UTF-8',
            delimiter: options.delimiter ?? '',
            complete: (results) => {
                const headers = results.meta.fields || []
                const rows = results.data as Record<string, string>[]

                resolve({
                    headers,
                    rows,
                    totalRows: rows.length,
                    errors: results.errors,
                })
            },
            error: (error) => {
                reject(error)
            },
        })
    })
}

/**
 * Faz parse de uma string CSV
 */
export function parseCSVString(
    csvString: string,
    options: ParseOptions = {}
): ParsedCSV {
    const results = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: options.skipEmptyLines ?? true,
        delimiter: options.delimiter ?? '',
    })

    return {
        headers: results.meta.fields || [],
        rows: results.data as Record<string, string>[],
        totalRows: results.data.length,
        errors: results.errors,
    }
}

/**
 * Valida um email
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email?.trim() || '')
}

/**
 * Valida uma linha de lead
 */
export interface ValidationResult {
    isValid: boolean
    errors: string[]
}

export function validateLeadRow(
    row: Record<string, string>,
    mapping: Record<string, string>
): ValidationResult {
    const errors: string[] = []

    // Email é obrigatório
    const emailColumn = Object.keys(mapping).find(col => mapping[col] === 'email')
    if (!emailColumn || !row[emailColumn]) {
        errors.push('Email é obrigatório')
    } else if (!isValidEmail(row[emailColumn])) {
        errors.push('Email inválido')
    }

    // Nome é obrigatório
    const firstNameColumn = Object.keys(mapping).find(col => mapping[col] === 'firstName')
    if (!firstNameColumn || !row[firstNameColumn]?.trim()) {
        errors.push('Nome é obrigatório')
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

/**
 * Aplica o mapeamento a uma linha
 */
export function applyMapping(
    row: Record<string, string>,
    mapping: Record<string, string>
): Record<string, string | null> {
    const result: Record<string, string | null> = {}

    for (const [csvColumn, leadField] of Object.entries(mapping)) {
        if (leadField && leadField !== 'ignore') {
            const value = row[csvColumn]?.trim() || null
            result[leadField] = value
        }
    }

    return result
}

/**
 * Processa o CSV completo e retorna leads prontos para importar
 */
export interface ProcessedLead {
    data: Record<string, string | null>
    rowIndex: number
    isValid: boolean
    errors: string[]
}

export function processCSVForImport(
    rows: Record<string, string>[],
    mapping: Record<string, string>
): {
    valid: ProcessedLead[]
    invalid: ProcessedLead[]
    total: number
} {
    const valid: ProcessedLead[] = []
    const invalid: ProcessedLead[] = []

    rows.forEach((row, index) => {
        const validation = validateLeadRow(row, mapping)
        const data = applyMapping(row, mapping)

        const processed: ProcessedLead = {
            data,
            rowIndex: index + 1, // 1-indexed para usuário
            isValid: validation.isValid,
            errors: validation.errors,
        }

        if (validation.isValid) {
            valid.push(processed)
        } else {
            invalid.push(processed)
        }
    })

    return {
        valid,
        invalid,
        total: rows.length,
    }
}