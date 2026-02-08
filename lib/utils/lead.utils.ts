// lib/utils/lead.utils.ts

import { LeadStatus, LeadSource, CompanySize } from '@prisma/client'
import {
    COUNTRIES,
    LEAD_STATUS_CONFIG,
    LEAD_SOURCE_CONFIG,
    COMPANY_SIZE_CONFIG,
} from '@/lib/constants/lead.constants'

// ============================================================
// PAÍS
// ============================================================

/**
 * Busca informações do país pelo código ISO
 */
export function getCountryByCode(code: string | null | undefined) {
    if (!code) return null
    return COUNTRIES.find((c) => c.code === code.toUpperCase()) ?? null
}

/**
 * Formata país para exibição (bandeira + nome)
 */
export function formatCountry(code: string | null | undefined): string {
    const country = getCountryByCode(code)
    if (!country) return code ?? ''
    return `${country.flag} ${country.name}`
}

/**
 * Retorna apenas a bandeira do país
 */
export function getCountryFlag(code: string | null | undefined): string {
    const country = getCountryByCode(code)
    return country?.flag ?? '🌍'
}

// ============================================================
// STATUS
// ============================================================

/**
 * Retorna configuração do status
 */
export function getStatusConfig(status: LeadStatus) {
    return LEAD_STATUS_CONFIG[status]
}

/**
 * Retorna label do status
 */
export function getStatusLabel(status: LeadStatus): string {
    return LEAD_STATUS_CONFIG[status]?.label ?? status
}

// ============================================================
// ORIGEM
// ============================================================

/**
 * Retorna configuração da origem
 */
export function getSourceConfig(source: LeadSource) {
    return LEAD_SOURCE_CONFIG[source]
}

/**
 * Retorna label da origem
 */
export function getSourceLabel(source: LeadSource): string {
    return LEAD_SOURCE_CONFIG[source]?.label ?? source
}

// ============================================================
// PORTE DA EMPRESA
// ============================================================

/**
 * Retorna configuração do porte
 */
export function getCompanySizeConfig(size: CompanySize | null | undefined) {
    if (!size) return null
    return COMPANY_SIZE_CONFIG[size]
}

/**
 * Retorna label do porte (curto)
 */
export function getCompanySizeLabel(size: CompanySize | null | undefined): string {
    if (!size) return ''
    return COMPANY_SIZE_CONFIG[size]?.short ?? size
}

// ============================================================
// FORMATAÇÃO
// ============================================================

/**
 * Formata nome completo
 */
export function formatFullName(
    firstName: string,
    lastName?: string | null
): string {
    return lastName ? `${firstName} ${lastName}`.trim() : firstName
}

/**
 * Extrai primeiro nome e sobrenome de um nome completo
 */
export function splitFullName(fullName: string): {
    firstName: string
    lastName: string | null
} {
    const parts = fullName.trim().split(/\s+/)
    const firstName = parts[0] || ''
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : null
    return { firstName, lastName }
}

/**
 * Formata telefone para exibição (básico)
 */
export function formatPhone(phone: string | null | undefined): string {
    if (!phone) return ''
    // Remove tudo que não é número
    const numbers = phone.replace(/\D/g, '')

    // Formato brasileiro
    if (numbers.length === 11) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    }
    if (numbers.length === 10) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    }

    // Retorna original se não reconhecer o formato
    return phone
}

// ============================================================
// SANITIZAÇÃO
// ============================================================

/**
 * Converte string vazia para null
 */
export function emptyToNull<T>(value: T): T | null {
    if (value === '') return null
    if (value === undefined) return null
    return value
}

/**
 * Sanitiza todos os campos de um objeto (converte '' para null)
 */
export function sanitizeFormData<T extends Record<string, unknown>>(
    data: T
): T {
    const result = { ...data }

    for (const key in result) {
        const value = result[key]
        if (value === '' || value === undefined) {
            result[key] = null as T[Extract<keyof T, string>]
        }
    }

    return result
}

// Alias para manter compatibilidade
export const sanitizeLeadData = sanitizeFormData

/**
 * Prepara dados do lead vindos do banco para o formulário
 * (converte null para string vazia para inputs)
 */
export function prepareLeadForForm<T extends Record<string, unknown>>(
    lead: T
): T {
    const result = { ...lead }

    for (const key in result) {
        if (result[key] === null) {
            result[key] = '' as T[Extract<keyof T, string>]
        }
    }

    return result
}