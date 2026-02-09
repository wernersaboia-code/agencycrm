// lib/file-parser.ts

import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { IMPORT_TEMPLATE_HEADERS, IMPORT_TEMPLATE_EXAMPLE } from './constants/csv-mapping.constants'

// ============================================================
// TIPOS
// ============================================================

export interface ParsedFile {
    headers: string[]
    rows: Record<string, string>[]
    totalRows: number
    fileName: string
    fileType: 'csv' | 'xlsx' | 'xls' | 'txt'
}

export interface ParseError {
    message: string
    details?: string
}

export type ParseResult =
    | { success: true; data: ParsedFile }
    | { success: false; error: ParseError }

// ============================================================
// CONSTANTES
// ============================================================

const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.txt']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// ============================================================
// FUNÇÕES DE LIMPEZA
// ============================================================

/**
 * Limpa e normaliza valor de célula
 */
export function cleanCellValue(value: unknown): string {
    if (value === null || value === undefined) return ''

    let str = String(value).trim()

    // Remove caracteres invisíveis e de controle
    str = str.replace(/[\x00-\x1F\x7F]/g, '')

    // Normaliza espaços múltiplos
    str = str.replace(/\s+/g, ' ')

    return str.trim()
}

/**
 * Limpa email - corrige formatações comuns de proteção anti-spam
 */
export function cleanEmail(email: string): string {
    if (!email) return ''

    let cleaned = email.trim().toLowerCase()

    // Corrige formatações comuns de proteção anti-spam
    cleaned = cleaned
        // Variações de [@]
        .replace(/\s*\[\s*@\s*\]\s*/g, '@')
        .replace(/\s*\(\s*@\s*\)\s*/g, '@')
        .replace(/\s*\{\s*@\s*\}\s*/g, '@')
        .replace(/\s*<\s*@\s*>\s*/g, '@')
        .replace(/\s*\[@\]\s*/g, '@')
        // Variações de "at"
        .replace(/\s+at\s+/gi, '@')
        .replace(/\(at\)/gi, '@')
        .replace(/\[at\]/gi, '@')
        // Variações de ponto
        .replace(/\s*\[dot\]\s*/gi, '.')
        .replace(/\s*\(dot\)\s*/gi, '.')
        .replace(/\s*\[punkt\]\s*/gi, '.') // alemão
        .replace(/\s*\(punkt\)\s*/gi, '.')
        .replace(/\s+dot\s+/gi, '.')
        // Remove vírgulas, pontos e espaços no final
        .replace(/[,.\s]+$/, '')
        // Remove espaços restantes
        .replace(/\s+/g, '')

    return cleaned
}

/**
 * Limpa número de telefone
 */
export function cleanPhone(phone: string): string {
    if (!phone) return ''

    // Mantém apenas números, +, espaços, parênteses e hífens
    let cleaned = phone.replace(/[^\d\s()\-+.]/g, '')

    // Normaliza espaços
    cleaned = cleaned.replace(/\s+/g, ' ').trim()

    return cleaned
}

/**
 * Valida se é um email válido
 */
export function isValidEmail(email: string): boolean {
    if (!email) return false
    const cleaned = cleanEmail(email)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(cleaned)
}

/**
 * Verifica se uma linha tem dados significativos
 * (não é só espaços ou campos vazios)
 */
function hasSignificantData(row: Record<string, string>, minFields: number = 2): boolean {
    const nonEmptyValues = Object.values(row).filter(v => v && v.trim() !== '')
    return nonEmptyValues.length >= minFields
}

// ============================================================
// DETECTAR DELIMITADOR
// ============================================================

/**
 * Tenta detectar o delimitador do arquivo
 */
function detectDelimiter(text: string): string {
    const delimiters = ['\t', ',', ';', '|']
    const lines = text.split('\n').slice(0, 10).filter(l => l.trim() !== '')

    if (lines.length === 0) return ','

    const counts: Record<string, number[]> = {}

    for (const delimiter of delimiters) {
        counts[delimiter] = lines.map(line => {
            let count = 0
            let inQuotes = false
            for (const char of line) {
                if (char === '"') inQuotes = !inQuotes
                if (char === delimiter && !inQuotes) count++
            }
            return count
        })
    }

    let bestDelimiter = ','
    let bestScore = 0

    for (const delimiter of delimiters) {
        const delimCounts = counts[delimiter]
        const nonZeroCounts = delimCounts.filter(c => c > 0)

        if (nonZeroCounts.length > 0) {
            const first = nonZeroCounts[0]
            const isConsistent = nonZeroCounts.every(c => Math.abs(c - first) <= 1)
            const avgCount = nonZeroCounts.reduce((a, b) => a + b, 0) / nonZeroCounts.length
            const coverage = nonZeroCounts.length / delimCounts.length

            // TAB tem prioridade se encontrado consistentemente
            const tabBonus = delimiter === '\t' ? 1.5 : 1
            const score = avgCount * coverage * (isConsistent ? 2 : 1) * tabBonus

            if (score > bestScore) {
                bestScore = score
                bestDelimiter = delimiter
            }
        }
    }

    return bestDelimiter
}

// ============================================================
// PARSER DE CSV/TXT
// ============================================================

async function parseCSV(file: File): Promise<ParseResult> {
    return new Promise((resolve) => {
        const reader = new FileReader()

        reader.onload = (event) => {
            const text = event.target?.result as string

            if (!text || text.trim().length === 0) {
                resolve({
                    success: false,
                    error: {
                        message: 'Arquivo vazio',
                        details: 'O arquivo não contém dados',
                    },
                })
                return
            }

            const delimiter = detectDelimiter(text)

            Papa.parse(text, {
                header: true,
                skipEmptyLines: 'greedy', // Remove linhas vazias de forma mais agressiva
                delimiter: delimiter,
                transformHeader: (header) => cleanCellValue(header),
                complete: (results) => {
                    const headers = (results.meta.fields || []).filter(h => h && h.trim() !== '')

                    if (headers.length === 0) {
                        resolve({
                            success: false,
                            error: {
                                message: 'Sem colunas válidas',
                                details: 'Não foi possível identificar as colunas. Verifique se a primeira linha contém os cabeçalhos.',
                            },
                        })
                        return
                    }

                    const rows = (results.data as Record<string, unknown>[])
                        .map((row) => {
                            const cleanedRow: Record<string, string> = {}
                            for (const [key, value] of Object.entries(row)) {
                                if (key && key.trim() !== '') {
                                    cleanedRow[key] = cleanCellValue(value)
                                }
                            }
                            return cleanedRow
                        })
                        .filter((row) => hasSignificantData(row, 2)) // Precisa ter pelo menos 2 campos

                    resolve({
                        success: true,
                        data: {
                            headers,
                            rows,
                            totalRows: rows.length,
                            fileName: file.name,
                            fileType: file.name.toLowerCase().endsWith('.txt') ? 'txt' : 'csv',
                        },
                    })
                },
                error: (error: Error) => {
                    resolve({
                        success: false,
                        error: {
                            message: 'Erro ao processar arquivo',
                            details: error.message,
                        },
                    })
                },
            })
        }

        reader.onerror = () => {
            resolve({
                success: false,
                error: {
                    message: 'Erro ao ler arquivo',
                    details: 'Não foi possível ler o conteúdo do arquivo',
                },
            })
        }

        reader.readAsText(file, 'UTF-8')
    })
}

// ============================================================
// PARSER DE EXCEL
// ============================================================

async function parseExcel(file: File): Promise<ParseResult> {
    try {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })

        const firstSheetName = workbook.SheetNames[0]
        if (!firstSheetName) {
            return {
                success: false,
                error: {
                    message: 'Arquivo Excel vazio',
                    details: 'O arquivo não contém nenhuma planilha',
                },
            }
        }

        const worksheet = workbook.Sheets[firstSheetName]

        // Converte para array de arrays
        const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
            header: 1,
            defval: '',
            blankrows: false,
        })

        if (jsonData.length === 0) {
            return {
                success: false,
                error: {
                    message: 'Planilha vazia',
                    details: 'A planilha não contém dados',
                },
            }
        }

        // Primeira linha são os headers
        const rawHeaders = jsonData[0] as unknown[]
        const headers = rawHeaders.map((h) => cleanCellValue(h)).filter((h) => h !== '')

        if (headers.length === 0) {
            return {
                success: false,
                error: {
                    message: 'Sem cabeçalhos',
                    details: 'Não foi possível identificar os nomes das colunas na primeira linha',
                },
            }
        }

        // Processa as linhas de dados
        const rows: Record<string, string>[] = []

        for (let i = 1; i < jsonData.length; i++) {
            const rowData = jsonData[i] as unknown[]
            const row: Record<string, string> = {}

            // Mapeia cada header para seu valor
            let hasAnyData = false
            headers.forEach((header, index) => {
                const rawValue = rowData[index]
                const value = cleanCellValue(rawValue)
                row[header] = value
                if (value) hasAnyData = true
            })

            // Só adiciona se tiver dados significativos (pelo menos 2 campos preenchidos)
            if (hasAnyData && hasSignificantData(row, 2)) {
                rows.push(row)
            }
        }

        const fileType = file.name.toLowerCase().endsWith('.xlsx') ? 'xlsx' : 'xls'

        return {
            success: true,
            data: {
                headers,
                rows,
                totalRows: rows.length,
                fileName: file.name,
                fileType,
            },
        }
    } catch (error) {
        return {
            success: false,
            error: {
                message: 'Erro ao processar arquivo Excel',
                details: error instanceof Error ? error.message : 'Erro desconhecido',
            },
        }
    }
}

// ============================================================
// PARSER PRINCIPAL
// ============================================================

export async function parseFile(file: File): Promise<ParseResult> {
    if (file.size > MAX_FILE_SIZE) {
        return {
            success: false,
            error: {
                message: 'Arquivo muito grande',
                details: `O tamanho máximo permitido é ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            },
        }
    }

    const fileName = file.name.toLowerCase()
    const extension = SUPPORTED_EXTENSIONS.find((ext) => fileName.endsWith(ext))

    if (!extension) {
        return {
            success: false,
            error: {
                message: 'Formato não suportado',
                details: `Formatos aceitos: ${SUPPORTED_EXTENSIONS.join(', ')}`,
            },
        }
    }

    if (extension === '.xlsx' || extension === '.xls') {
        return parseExcel(file)
    }

    return parseCSV(file)
}

// ============================================================
// VALIDAÇÃO DE LINHA
// ============================================================

export interface ValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

export function validateLeadRow(
    row: Record<string, string>,
    mapping: Record<string, string>
): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    const getMappedValue = (fieldKey: string): string | null => {
        const sourceColumn = Object.keys(mapping).find((col) => mapping[col] === fieldKey)
        if (!sourceColumn) return null
        return row[sourceColumn]?.trim() || null
    }

    // Email é obrigatório
    const email = getMappedValue('email')
    if (!email) {
        errors.push('Email é obrigatório')
    } else {
        const cleanedEmail = cleanEmail(email)
        if (!isValidEmail(cleanedEmail)) {
            errors.push(`Email inválido: ${email}`)
        }
    }

    // Nome é obrigatório (firstName OU lastName)
    const firstName = getMappedValue('firstName')
    const lastName = getMappedValue('lastName')

    if (!firstName && !lastName) {
        errors.push('Nome é obrigatório')
    }

    // Warnings
    const phone = getMappedValue('phone')
    if (phone && phone.replace(/\D/g, '').length < 8) {
        warnings.push('Telefone parece incompleto')
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    }
}

// ============================================================
// APLICAR MAPEAMENTO
// ============================================================

export function applyMapping(
    row: Record<string, string>,
    mapping: Record<string, string>
): Record<string, string | null> {
    const result: Record<string, string | null> = {}

    for (const [csvColumn, leadField] of Object.entries(mapping)) {
        if (leadField && leadField !== 'ignore') {
            let value = row[csvColumn]?.trim() || null

            if (value) {
                if (leadField === 'email') {
                    value = cleanEmail(value)
                } else if (leadField === 'phone' || leadField === 'mobile') {
                    value = cleanPhone(value)
                }
            }

            result[leadField] = value || null
        }
    }

    // Se não tem firstName mas tem lastName, usa lastName como firstName
    if (!result.firstName && result.lastName) {
        result.firstName = result.lastName
        result.lastName = null
    }

    return result
}

// ============================================================
// PROCESSAMENTO COMPLETO
// ============================================================

export interface ProcessedLead {
    data: Record<string, string | null>
    rowIndex: number
    isValid: boolean
    errors: string[]
    warnings: string[]
}

export interface ProcessingResult {
    valid: ProcessedLead[]
    invalid: ProcessedLead[]
    total: number
}

export function processForImport(
    rows: Record<string, string>[],
    mapping: Record<string, string>
): ProcessingResult {
    const valid: ProcessedLead[] = []
    const invalid: ProcessedLead[] = []

    rows.forEach((row, index) => {
        const validation = validateLeadRow(row, mapping)
        const data = applyMapping(row, mapping)

        const processed: ProcessedLead = {
            data,
            rowIndex: index + 2,
            isValid: validation.isValid,
            errors: validation.errors,
            warnings: validation.warnings,
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

// ============================================================
// GERAÇÃO DE TEMPLATES
// ============================================================

export function generateExcelTemplate(): Blob {
    const worksheet = XLSX.utils.aoa_to_sheet([
        IMPORT_TEMPLATE_HEADERS,
        IMPORT_TEMPLATE_EXAMPLE,
    ])

    worksheet['!cols'] = IMPORT_TEMPLATE_HEADERS.map(() => ({ wch: 20 }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    return new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
}

export function generateCSVTemplate(): string {
    return `${IMPORT_TEMPLATE_HEADERS.join(',')}\n${IMPORT_TEMPLATE_EXAMPLE.join(',')}`
}