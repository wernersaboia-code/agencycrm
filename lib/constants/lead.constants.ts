// lib/constants/lead.constants.ts

import { LeadStatus, LeadSource, CompanySize } from '@prisma/client'

// ============================================================
// STATUS DO LEAD
// ============================================================

export const LEAD_STATUS_CONFIG: Record<
    LeadStatus,
    {
        label: string
        color: string
        bgColor: string
        textColor: string
        description: string
    }
> = {
    NEW: {
        label: 'Novo',
        color: 'gray',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-700 dark:text-gray-300',
        description: 'Não contatado',
    },
    CONTACTED: {
        label: 'Contatado',
        color: 'blue',
        bgColor: 'bg-blue-100 dark:bg-blue-900',
        textColor: 'text-blue-700 dark:text-blue-300',
        description: 'Email enviado',
    },
    OPENED: {
        label: 'Abriu Email',
        color: 'indigo',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900',
        textColor: 'text-indigo-700 dark:text-indigo-300',
        description: 'Abriu o email',
    },
    CLICKED: {
        label: 'Clicou',
        color: 'purple',
        bgColor: 'bg-purple-100 dark:bg-purple-900',
        textColor: 'text-purple-700 dark:text-purple-300',
        description: 'Clicou em link',
    },
    REPLIED: {
        label: 'Respondeu',
        color: 'indigo',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900',
        textColor: 'text-indigo-700 dark:text-indigo-300',
        description: 'Respondeu email',
    },
    CALLED: {
        label: 'Ligação',
        color: 'orange',
        bgColor: 'bg-orange-100 dark:bg-orange-900',
        textColor: 'text-orange-700 dark:text-orange-300',
        description: 'Ligação realizada',
    },
    INTERESTED: {
        label: 'Interessado',
        color: 'green',
        bgColor: 'bg-green-100 dark:bg-green-900',
        textColor: 'text-green-700 dark:text-green-300',
        description: 'Demonstrou interesse',
    },
    NOT_INTERESTED: {
        label: 'Sem Interesse',
        color: 'red',
        bgColor: 'bg-red-100 dark:bg-red-900',
        textColor: 'text-red-700 dark:text-red-300',
        description: 'Não tem interesse',
    },
    NEGOTIATING: {
        label: 'Negociando',
        color: 'yellow',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900',
        textColor: 'text-yellow-700 dark:text-yellow-300',
        description: 'Em negociação',
    },
    CONVERTED: {
        label: 'Convertido',
        color: 'teal',
        bgColor: 'bg-teal-100 dark:bg-teal-900',
        textColor: 'text-teal-700 dark:text-teal-300',
        description: 'Virou cliente',
    },
    UNSUBSCRIBED: {
        label: 'Descadastrado',
        color: 'slate',
        bgColor: 'bg-slate-100 dark:bg-slate-800',
        textColor: 'text-slate-700 dark:text-slate-300',
        description: 'Se descadastrou',
    },
    BOUNCED: {
        label: 'Email Inválido',
        color: 'rose',
        bgColor: 'bg-rose-100 dark:bg-rose-900',
        textColor: 'text-rose-700 dark:text-rose-300',
        description: 'Email retornou',
    },
}

// Array para selects
export const LEAD_STATUS_OPTIONS = Object.entries(LEAD_STATUS_CONFIG).map(
    ([value, config]) => ({
        value: value as LeadStatus,
        label: config.label,
        description: config.description,
    })
)

// ============================================================
// ORIGEM DO LEAD
// ============================================================

export const LEAD_SOURCE_CONFIG: Record<
    LeadSource,
    {
        label: string
        icon: string
        color: string
    }
> = {
    MANUAL: { label: 'Manual', icon: 'PenLine', color: 'gray' },
    IMPORT: { label: 'Importado', icon: 'Upload', color: 'blue' },
    MARKETPLACE: { label: 'Marketplace', icon: 'ShoppingCart', color: 'purple' },
    WEBSITE: { label: 'Website', icon: 'Globe', color: 'green' },
    REFERRAL: { label: 'Indicação', icon: 'Users', color: 'orange' },
    OTHER: { label: 'Outro', icon: 'MoreHorizontal', color: 'slate' },
}

export const LEAD_SOURCE_OPTIONS = Object.entries(LEAD_SOURCE_CONFIG).map(
    ([value, config]) => ({
        value: value as LeadSource,
        label: config.label,
    })
)

// ============================================================
// PORTE DA EMPRESA
// ============================================================

export const COMPANY_SIZE_CONFIG: Record<
    CompanySize,
    {
        label: string
        short: string
        range: string
    }
> = {
    MICRO: { label: 'Microempresa', short: 'Micro', range: '1-10' },
    SMALL: { label: 'Pequena empresa', short: 'Pequena', range: '11-50' },
    MEDIUM: { label: 'Média empresa', short: 'Média', range: '51-200' },
    LARGE: { label: 'Grande empresa', short: 'Grande', range: '201-500' },
    ENTERPRISE: { label: 'Enterprise', short: 'Enterprise', range: '500+' },
}

export const COMPANY_SIZE_OPTIONS = Object.entries(COMPANY_SIZE_CONFIG).map(
    ([value, config]) => ({
        value: value as CompanySize,
        label: `${config.short} (${config.range} funcionários)`,
        short: config.short,
    })
)

// ============================================================
// PAÍSES (priorizando Europa + Brasil)
// ============================================================

export const COUNTRIES = [
    // Mais usados primeiro
    { code: 'BR', name: 'Brasil', flag: '🇧🇷', region: 'América do Sul' },
    { code: 'DE', name: 'Alemanha', flag: '🇩🇪', region: 'Europa' },
    { code: 'AT', name: 'Áustria', flag: '🇦🇹', region: 'Europa' },
    { code: 'CH', name: 'Suíça', flag: '🇨🇭', region: 'Europa' },

    // Europa
    { code: 'FR', name: 'França', flag: '🇫🇷', region: 'Europa' },
    { code: 'IT', name: 'Itália', flag: '🇮🇹', region: 'Europa' },
    { code: 'ES', name: 'Espanha', flag: '🇪🇸', region: 'Europa' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹', region: 'Europa' },
    { code: 'NL', name: 'Holanda', flag: '🇳🇱', region: 'Europa' },
    { code: 'BE', name: 'Bélgica', flag: '🇧🇪', region: 'Europa' },
    { code: 'GB', name: 'Reino Unido', flag: '🇬🇧', region: 'Europa' },
    { code: 'IE', name: 'Irlanda', flag: '🇮🇪', region: 'Europa' },
    { code: 'PL', name: 'Polônia', flag: '🇵🇱', region: 'Europa' },
    { code: 'CZ', name: 'República Tcheca', flag: '🇨🇿', region: 'Europa' },
    { code: 'SE', name: 'Suécia', flag: '🇸🇪', region: 'Europa' },
    { code: 'NO', name: 'Noruega', flag: '🇳🇴', region: 'Europa' },
    { code: 'DK', name: 'Dinamarca', flag: '🇩🇰', region: 'Europa' },
    { code: 'FI', name: 'Finlândia', flag: '🇫🇮', region: 'Europa' },
    { code: 'GR', name: 'Grécia', flag: '🇬🇷', region: 'Europa' },
    { code: 'RO', name: 'Romênia', flag: '🇷🇴', region: 'Europa' },
    { code: 'HU', name: 'Hungria', flag: '🇭🇺', region: 'Europa' },
    { code: 'SK', name: 'Eslováquia', flag: '🇸🇰', region: 'Europa' },
    { code: 'HR', name: 'Croácia', flag: '🇭🇷', region: 'Europa' },
    { code: 'SI', name: 'Eslovênia', flag: '🇸🇮', region: 'Europa' },
    { code: 'LU', name: 'Luxemburgo', flag: '🇱🇺', region: 'Europa' },

    // Américas
    { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', region: 'América do Norte' },
    { code: 'CA', name: 'Canadá', flag: '🇨🇦', region: 'América do Norte' },
    { code: 'MX', name: 'México', flag: '🇲🇽', region: 'América do Norte' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', region: 'América do Sul' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱', region: 'América do Sul' },
    { code: 'CO', name: 'Colômbia', flag: '🇨🇴', region: 'América do Sul' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪', region: 'América do Sul' },
    { code: 'UY', name: 'Uruguai', flag: '🇺🇾', region: 'América do Sul' },

    // Ásia e outros
    { code: 'JP', name: 'Japão', flag: '🇯🇵', region: 'Ásia' },
    { code: 'CN', name: 'China', flag: '🇨🇳', region: 'Ásia' },
    { code: 'IN', name: 'Índia', flag: '🇮🇳', region: 'Ásia' },
    { code: 'KR', name: 'Coreia do Sul', flag: '🇰🇷', region: 'Ásia' },
    { code: 'SG', name: 'Singapura', flag: '🇸🇬', region: 'Ásia' },
    { code: 'AU', name: 'Austrália', flag: '🇦🇺', region: 'Oceania' },
    { code: 'NZ', name: 'Nova Zelândia', flag: '🇳🇿', region: 'Oceania' },
    { code: 'ZA', name: 'África do Sul', flag: '🇿🇦', region: 'África' },
    { code: 'AE', name: 'Emirados Árabes', flag: '🇦🇪', region: 'Oriente Médio' },
    { code: 'IL', name: 'Israel', flag: '🇮🇱', region: 'Oriente Médio' },
] as const

export type CountryCode = (typeof COUNTRIES)[number]['code']

// ============================================================
// SEGMENTOS / INDÚSTRIAS
// ============================================================

export const INDUSTRIES = [
    'Agricultura e Pecuária',
    'Alimentação e Bebidas',
    'Arquitetura e Design',
    'Automotivo',
    'Aviação',
    'Bancos e Finanças',
    'Biotecnologia',
    'Construção Civil',
    'Consultoria',
    'E-commerce',
    'Educação',
    'Energia e Utilities',
    'Engenharia',
    'Entretenimento e Mídia',
    'Esportes',
    'Farmacêutico',
    'Governo e Setor Público',
    'Healthcare / Saúde',
    'Hotelaria e Turismo',
    'Imobiliário',
    'Indústria / Manufatura',
    'Jurídico',
    'Logística e Transporte',
    'Marketing e Publicidade',
    'Moda e Vestuário',
    'ONGs e Terceiro Setor',
    'Petróleo e Gás',
    'Recursos Humanos',
    'Seguros',
    'Serviços Profissionais',
    'Tecnologia / Software',
    'Telecomunicações',
    'Varejo',
    'Outro',
] as const

export type Industry = (typeof INDUSTRIES)[number]