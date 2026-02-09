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

export function cleanCellValue(value: unknown): string {
    if (value === null || value === undefined) return ''

    let str = String(value).trim()
    str = str.replace(/[\x00-\x1F\x7F]/g, '')
    str = str.replace(/\s+/g, ' ')

    return str.trim()
}

export function cleanEmail(email: string): string {
    if (!email) return ''

    let cleaned = email.trim().toLowerCase()

    cleaned = cleaned
        .replace(/\s*\[\s*@\s*\]\s*/g, '@')
        .replace(/\s*\(\s*@\s*\)\s*/g, '@')
        .replace(/\s*\{\s*@\s*\}\s*/g, '@')
        .replace(/\s*<\s*@\s*>\s*/g, '@')
        .replace(/\s*\[@\]\s*/g, '@')
        .replace(/\s+at\s+/gi, '@')
        .replace(/\(at\)/gi, '@')
        .replace(/\[at\]/gi, '@')
        .replace(/\s*\[dot\]\s*/gi, '.')
        .replace(/\s*\(dot\)\s*/gi, '.')
        .replace(/\s*\[punkt\]\s*/gi, '.')
        .replace(/\s*\(punkt\)\s*/gi, '.')
        .replace(/\s+dot\s+/gi, '.')
        .replace(/[,.\s]+$/, '')
        .replace(/\s+/g, '')

    return cleaned
}

export function cleanPhone(phone: string): string {
    if (!phone) return ''
    let cleaned = phone.replace(/[^\d\s()\-+.]/g, '')
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    return cleaned
}

export function isValidEmail(email: string): boolean {
    if (!email) return false
    const cleaned = cleanEmail(email)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(cleaned)
}

function hasSignificantData(row: Record<string, string>, minFields: number = 2): boolean {
    const nonEmptyValues = Object.values(row).filter(v => v && v.trim() !== '')
    return nonEmptyValues.length >= minFields
}

// ============================================================
// DETECTAR TIPO DE SEPARADOR (MELHORADO)
// ============================================================

interface DelimiterInfo {
    type: 'delimiter' | 'fixed-width'
    delimiter?: string
    columnRanges?: Array<{ start: number; end: number; header: string }>
}

/**
 * Detecta se o arquivo usa delimitadores ou é fixed-width (alinhado por espaços)
 */
function detectDelimiterType(text: string): DelimiterInfo {
    const lines = text.split('\n').filter(l => l.trim() !== '').slice(0, 10)

    if (lines.length === 0) {
        return { type: 'delimiter', delimiter: ',' }
    }

    const headerLine = lines[0]

    // 1. Primeiro, tenta detectar delimitadores tradicionais
    const delimiters = ['\t', ';', ',', '|']

    for (const delimiter of delimiters) {
        const headerParts = headerLine.split(delimiter)
        if (headerParts.length >= 2) {
            // Verifica se todas as linhas têm o mesmo número de partes
            const consistent = lines.every(line => {
                const parts = line.split(delimiter)
                return parts.length >= 2 && Math.abs(parts.length - headerParts.length) <= 1
            })

            if (consistent) {
                return { type: 'delimiter', delimiter }
            }
        }
    }

    // 2. Verifica se é fixed-width (espaços múltiplos como separador visual)
    // Procura por padrões de "texto + 2+ espaços + texto"
    const multiSpaceRegex = /\S+\s{2,}/g
    const matches = [...headerLine.matchAll(multiSpaceRegex)]

    if (matches.length >= 1) {
        // Encontrou padrão de fixed-width
        // Agora precisa determinar onde cada coluna começa e termina

        const columnRanges = detectColumnRanges(lines)

        if (columnRanges.length >= 2) {
            return { type: 'fixed-width', columnRanges }
        }
    }

    // 3. Fallback: tenta vírgula
    return { type: 'delimiter', delimiter: ',' }
}

/**
 * Detecta os ranges de cada coluna em um arquivo fixed-width
 * Analisa onde começam e terminam os "blocos" de texto
 */
function detectColumnRanges(lines: string[]): Array<{ start: number; end: number; header: string }> {
    if (lines.length === 0) return []

    const headerLine = lines[0]
    const ranges: Array<{ start: number; end: number; header: string }> = []

    // Encontra as posições onde há transição de "espaços" para "texto"
    // após uma sequência de 2+ espaços

    let inText = false
    let textStart = 0
    let spaceCount = 0

    for (let i = 0; i <= headerLine.length; i++) {
        const char = headerLine[i] || ' ' // Trata fim da linha como espaço
        const isSpace = char === ' ' || char === '\t'

        if (isSpace) {
            spaceCount++
            if (inText && spaceCount >= 2) {
                // Encontrou fim de uma coluna (2+ espaços após texto)
                const header = headerLine.substring(textStart, i - spaceCount + 1).trim()
                if (header) {
                    ranges.push({
                        start: textStart,
                        end: i - spaceCount + 1,
                        header,
                    })
                }
                inText = false
            }
        } else {
            if (!inText) {
                // Início de nova coluna
                textStart = i
                inText = true
            }
            spaceCount = 0
        }
    }

    // Adiciona a última coluna se houver
    if (inText) {
        const header = headerLine.substring(textStart).trim()
        if (header) {
            ranges.push({
                start: textStart,
                end: headerLine.length,
                header,
            })
        }
    }

    // Ajusta os ranges para capturar dados completos
    // O end de uma coluna é o start da próxima
    for (let i = 0; i < ranges.length - 1; i++) {
        ranges[i].end = ranges[i + 1].start
    }

    // Última coluna vai até o fim da linha
    if (ranges.length > 0) {
        ranges[ranges.length - 1].end = Math.max(
            ...lines.map(l => l.length)
        )
    }

    return ranges
}

/**
 * Parser para arquivos fixed-width
 */
function parseFixedWidth(
    text: string,
    columnRanges: Array<{ start: number; end: number; header: string }>
): { headers: string[]; rows: Record<string, string>[] } | null {
    const lines = text.split('\n').filter(l => l.trim() !== '')

    if (lines.length <= 1) return null

    const headers = columnRanges.map(r => r.header)
    const rows: Record<string, string>[] = []

    // Processa cada linha de dados (pula o header)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        const row: Record<string, string> = {}

        let hasData = false

        columnRanges.forEach((range, index) => {
            // Extrai o valor baseado nas posições
            const value = line.substring(range.start, range.end).trim()
            row[headers[index]] = value
            if (value) hasData = true
        })

        if (hasData) {
            rows.push(row)
        }
    }

    return { headers, rows }
}

// ============================================================
// PARSER DE CSV/TXT (ATUALIZADO)
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

            // Detecta o tipo de separador
            const delimiterInfo = detectDelimiterType(text)

            console.log('Delimiter detection:', delimiterInfo) // Debug

            // Se for fixed-width, usa parser especial
            if (delimiterInfo.type === 'fixed-width' && delimiterInfo.columnRanges) {
                const result = parseFixedWidth(text, delimiterInfo.columnRanges)

                if (result && result.rows.length > 0) {
                    // Limpa os valores
                    const cleanedRows = result.rows.map(row => {
                        const cleaned: Record<string, string> = {}
                        for (const [key, value] of Object.entries(row)) {
                            cleaned[key] = cleanCellValue(value)
                        }
                        return cleaned
                    })

                    resolve({
                        success: true,
                        data: {
                            headers: result.headers,
                            rows: cleanedRows,
                            totalRows: cleanedRows.length,
                            fileName: file.name,
                            fileType: 'txt',
                        },
                    })
                    return
                }
            }

            // Parser normal com delimitador
            const delimiter = delimiterInfo.delimiter || ','

            Papa.parse(text, {
                header: true,
                skipEmptyLines: 'greedy',
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
                        .filter((row) => hasSignificantData(row, 1))

                    if (rows.length === 0) {
                        resolve({
                            success: false,
                            error: {
                                message: 'Arquivo sem dados',
                                details: 'O arquivo não contém dados válidos para importar',
                            },
                        })
                        return
                    }

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

        const rows: Record<string, string>[] = []

        for (let i = 1; i < jsonData.length; i++) {
            const rowData = jsonData[i] as unknown[]
            const row: Record<string, string> = {}

            let hasAnyData = false
            headers.forEach((header, index) => {
                const rawValue = rowData[index]
                const value = cleanCellValue(rawValue)
                row[header] = value
                if (value) hasAnyData = true
            })

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

    const email = getMappedValue('email')
    if (!email) {
        errors.push('Email é obrigatório')
    } else {
        const cleanedEmail = cleanEmail(email)
        if (!isValidEmail(cleanedEmail)) {
            errors.push(`Email inválido: ${email}`)
        }
    }

    const firstName = getMappedValue('firstName')
    const lastName = getMappedValue('lastName')

    if (!firstName && !lastName) {
        errors.push('Nome é obrigatório')
    }

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