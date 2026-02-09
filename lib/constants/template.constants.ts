// lib/constants/template.constants.ts

import { TemplateCategory } from "@prisma/client"
import {
    Send,
    MessageSquare,
    FileText,
    Heart,
    RefreshCw,
    Newspaper,
    MoreHorizontal,
    LucideIcon
} from "lucide-react"

// ============================================================
// CONFIGURAÇÃO DE CATEGORIAS
// ============================================================

interface CategoryConfig {
    label: string
    description: string
    icon: LucideIcon
    color: string
    bgColor: string
}

export const TEMPLATE_CATEGORY_CONFIG: Record<TemplateCategory, CategoryConfig> = {
    PROSPECTING: {
        label: "Prospecção",
        description: "Primeiro contato com leads",
        icon: Send,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
    },
    FOLLOW_UP: {
        label: "Follow-up",
        description: "Acompanhamento após contato inicial",
        icon: MessageSquare,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
    },
    PROPOSAL: {
        label: "Proposta",
        description: "Envio de propostas comerciais",
        icon: FileText,
        color: "text-green-600",
        bgColor: "bg-green-100",
    },
    THANK_YOU: {
        label: "Agradecimento",
        description: "Agradecer por reunião, compra, etc.",
        icon: Heart,
        color: "text-pink-600",
        bgColor: "bg-pink-100",
    },
    REACTIVATION: {
        label: "Reativação",
        description: "Reconectar com leads frios",
        icon: RefreshCw,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
    },
    NEWSLETTER: {
        label: "Newsletter",
        description: "Novidades e conteúdos",
        icon: Newspaper,
        color: "text-cyan-600",
        bgColor: "bg-cyan-100",
    },
    OTHER: {
        label: "Outros",
        description: "Outros tipos de email",
        icon: MoreHorizontal,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
    },
}

// ============================================================
// VARIÁVEIS DISPONÍVEIS PARA TEMPLATES
// ============================================================

export interface TemplateVariable {
    key: string
    label: string
    description: string
    example: string
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
    // Contato
    { key: "firstName", label: "Primeiro Nome", description: "Nome do lead", example: "João" },
    { key: "lastName", label: "Sobrenome", description: "Sobrenome do lead", example: "Silva" },
    { key: "fullName", label: "Nome Completo", description: "Nome + Sobrenome", example: "João Silva" },
    { key: "email", label: "Email", description: "Email do lead", example: "joao@empresa.com" },
    { key: "phone", label: "Telefone", description: "Telefone principal", example: "+55 11 99999-1111" },

    // Empresa
    { key: "company", label: "Empresa", description: "Nome da empresa", example: "Tech Solutions" },
    { key: "jobTitle", label: "Cargo", description: "Cargo do lead", example: "Diretor de Marketing" },
    { key: "industry", label: "Segmento", description: "Segmento da empresa", example: "Tecnologia" },
    { key: "website", label: "Website", description: "Site da empresa", example: "www.techsolutions.com" },

    // Localização
    { key: "city", label: "Cidade", description: "Cidade do lead", example: "São Paulo" },
    { key: "state", label: "Estado", description: "Estado/Região", example: "SP" },
    { key: "country", label: "País", description: "País do lead", example: "Brasil" },
]

// ============================================================
// HELPERS
// ============================================================

export function getCategoryConfig(category: TemplateCategory): CategoryConfig {
    return TEMPLATE_CATEGORY_CONFIG[category] || TEMPLATE_CATEGORY_CONFIG.OTHER
}

export function getCategoryLabel(category: TemplateCategory): string {
    return getCategoryConfig(category).label
}

export function getCategoryOptions() {
    return Object.entries(TEMPLATE_CATEGORY_CONFIG).map(([value, config]) => ({
        value: value as TemplateCategory,
        label: config.label,
        description: config.description,
    }))
}

// ============================================================
// EXEMPLO DE LEAD PARA PREVIEW
// ============================================================

export const PREVIEW_LEAD = {
    firstName: "João",
    lastName: "Silva",
    fullName: "João Silva",
    email: "joao@techsolutions.com",
    phone: "+55 11 99999-1111",
    company: "Tech Solutions",
    jobTitle: "Diretor de Marketing",
    industry: "Tecnologia",
    website: "www.techsolutions.com",
    city: "São Paulo",
    state: "SP",
    country: "Brasil",
}

// ============================================================
// FUNÇÃO PARA SUBSTITUIR VARIÁVEIS
// ============================================================

export function replaceVariables(
    text: string,
    data: Record<string, string | null | undefined>
): string {
    let result = text

    TEMPLATE_VARIABLES.forEach((variable) => {
        const regex = new RegExp(`{{\\s*${variable.key}\\s*}}`, "gi")
        const value = data[variable.key] || `[${variable.label}]`
        result = result.replace(regex, value)
    })

    return result
}

// ============================================================
// TEMPLATES PADRÃO (para inicialização)
// ============================================================

export const DEFAULT_TEMPLATES = [
    {
        name: "Primeiro Contato",
        category: "PROSPECTING" as TemplateCategory,
        subject: "{{firstName}}, podemos ajudar a {{company}}?",
        body: `<p>Olá {{firstName}},</p>

<p>Meu nome é [Seu Nome] e trabalho na [Sua Empresa].</p>

<p>Notei que a <strong>{{company}}</strong> atua no segmento de {{industry}} e acredito que podemos ajudar vocês a alcançar melhores resultados.</p>

<p>Podemos agendar uma conversa rápida de 15 minutos para eu entender melhor suas necessidades?</p>

<p>Abraços,<br>
[Seu Nome]<br>
[Seu Telefone]</p>`,
    },
    {
        name: "Follow-up 1",
        category: "FOLLOW_UP" as TemplateCategory,
        subject: "{{firstName}}, ainda posso ajudar?",
        body: `<p>Olá {{firstName}},</p>

<p>Entrei em contato há alguns dias e não obtive retorno. Imagino que você esteja ocupado(a).</p>

<p>Continuo à disposição caso queira conhecer como podemos ajudar a {{company}}.</p>

<p>Se preferir, pode responder este email com o melhor horário para conversarmos.</p>

<p>Abraços,<br>
[Seu Nome]</p>`,
    },
    {
        name: "Agradecimento pós-reunião",
        category: "THANK_YOU" as TemplateCategory,
        subject: "{{firstName}}, obrigado pela conversa!",
        body: `<p>Olá {{firstName}},</p>

<p>Foi um prazer conversar com você hoje!</p>

<p>Como combinamos, segue em anexo [material/proposta/apresentação].</p>

<p>Fico à disposição para qualquer dúvida.</p>

<p>Abraços,<br>
[Seu Nome]</p>`,
    },
]