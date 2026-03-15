// lib/constants/marketplace-csv.constants.ts

export interface MarketplaceMappableField {
    key: string
    label: string
    required: boolean
    description: string
    aliases: string[]
}

export const MARKETPLACE_CSV_FIELDS: MarketplaceMappableField[] = [
    // === OBRIGATÓRIOS ===
    {
        key: "country",
        label: "Country",
        required: true,
        description: "País (código ISO ou nome)",
        aliases: ["pais", "país", "land", "pays", "country", "nation"],
    },
    {
        key: "companyName",
        label: "Company Name",
        required: true,
        description: "Nome da empresa",
        aliases: [
            "nome da empresa", "company", "company name", "empresa", "firma",
            "unternehmen", "société", "compañia", "razao social", "razão social",
        ],
    },

    // === RECOMENDADO ===
    {
        key: "emailGeneral",
        label: "General Email",
        required: false,
        description: "Email geral da empresa (recomendado)",
        aliases: [
            "e-mail geral", "email geral", "email", "e-mail", "mail", "general email",
            "contact email", "correo", "correio",
        ],
    },

    // === EMPRESA ===
    {
        key: "companyType",
        label: "Company Type",
        required: false,
        description: "Tipo de empresa (Importer, Retailer, etc.)",
        aliases: ["tipo de empresa", "company type", "type", "unternehmenstyp", "tipo"],
    },
    {
        key: "sector",
        label: "Sector",
        required: false,
        description: "Setor de atuação",
        aliases: ["sector", "setor", "industry", "segmento", "branche", "secteur", "ramo"],
    },
    {
        key: "website",
        label: "Website",
        required: false,
        description: "Site da empresa",
        aliases: ["site web", "website", "site", "web", "url", "homepage", "webseite", "página"],
    },
    {
        key: "contactForm",
        label: "Contact Form",
        required: false,
        description: "URL do formulário de contato",
        aliases: ["contact form", "formulário", "formulario", "kontaktformular", "form"],
    },

    // === TELEFONES ===
    {
        key: "phoneGeneral",
        label: "General Phone",
        required: false,
        description: "Telefone geral",
        aliases: [
            "telefone geral", "phone", "general phone", "telefone", "tel", "telefon",
            "téléphone", "teléfono", "fone",
        ],
    },
    {
        key: "phonePurchasing",
        label: "Purchasing Phone",
        required: false,
        description: "Telefone do comprador/purchasing",
        aliases: [
            "telefone comprador", "purchasing phone", "buyer phone", "telefone purchasing",
            "tel comprador", "einkäufer telefon",
        ],
    },

    // === EMAILS ===
    {
        key: "emailPurchasing",
        label: "Purchasing Email",
        required: false,
        description: "Email do departamento de compras",
        aliases: [
            "e-mail purchasing", "email purchasing", "purchasing email", "buyer email",
            "email compras", "einkäufer email", "email comprador",
        ],
    },

    // === CONTATOS ===
    {
        key: "manager",
        label: "Manager",
        required: false,
        description: "Nome do gerente/diretor",
        aliases: [
            "gerente", "manager", "director", "diretor", "geschäftsführer",
            "directeur", "ceo", "owner", "proprietário",
        ],
    },
    {
        key: "purchasingPerson",
        label: "Purchasing Person",
        required: false,
        description: "Pessoa responsável por compras",
        aliases: [
            "purchasing person", "comprador", "buyer", "einkäufer", "acheteur",
            "responsável compras", "purchasing contact",
        ],
    },

    // === DETALHES DO NEGÓCIO ===
    {
        key: "productPortfolio",
        label: "Product Portfolio",
        required: false,
        description: "Portfólio de produtos",
        aliases: [
            "product portfolio", "portfolio", "produtos", "produktportfolio",
            "portefeuille", "cartera de productos",
        ],
    },
    {
        key: "specialty",
        label: "Specialty",
        required: false,
        description: "Especialidade (Full range, Selected brands, etc.)",
        aliases: [
            "especialidade", "specialty", "specialization", "spezialität",
            "spécialité", "especialidad",
        ],
    },
    {
        key: "customerTypes",
        label: "Customer Types",
        required: false,
        description: "Tipos de clientes atendidos",
        aliases: [
            "tipo de clientes", "customer types", "customer type", "clientes",
            "kundentyp", "types de clients", "tipos de clientes",
        ],
    },
    {
        key: "productTypes",
        label: "Product Types",
        required: false,
        description: "Tipos de produtos comercializados",
        aliases: [
            "tipo de produtos", "product types", "product type", "produtos",
            "produkttyp", "types de produits", "tipos de productos",
        ],
    },
    {
        key: "sourcing",
        label: "Sourcing",
        required: false,
        description: "Origem dos produtos (worldwide, EU, etc.)",
        aliases: [
            "sourcing", "origem", "source", "beschaffung", "approvisionnement",
            "abastecimiento", "procedência",
        ],
    },
    {
        key: "exportSales",
        label: "Export Sales",
        required: false,
        description: "Regiões de exportação",
        aliases: [
            "export sales", "exportação", "export", "exportverkauf", "exportation",
            "ventas de exportación", "mercados",
        ],
    },
    {
        key: "specialFocus",
        label: "Special Focus",
        required: false,
        description: "Foco especial do negócio",
        aliases: [
            "special focus", "foco especial", "focus", "schwerpunkt",
            "focus spécial", "enfoque especial",
        ],
    },
    {
        key: "productKeywords",
        label: "Product Keywords",
        required: false,
        description: "Palavras-chave dos produtos",
        aliases: [
            "product key words", "product keywords", "keywords", "palavras-chave",
            "schlüsselwörter", "mots-clés", "palabras clave", "tags",
        ],
    },
    {
        key: "salesPointsCount",
        label: "Number of Sales Points",
        required: false,
        description: "Número de pontos de venda",
        aliases: [
            "number of sales point", "number of sales points", "sales points",
            "pontos de venda", "verkaufsstellen", "points de vente", "lojas",
        ],
    },
]

// Campos obrigatórios
export const REQUIRED_MARKETPLACE_FIELDS = ["country", "companyName"]

// Campos recomendados
export const RECOMMENDED_MARKETPLACE_FIELDS = ["emailGeneral"]

// Headers para o template de download
export const MARKETPLACE_CSV_TEMPLATE_HEADERS = [
    "Country",
    "Company Name",
    "Company Type",
    "Sector",
    "Website",
    "Contact Form",
    "General Phone",
    "Purchasing Phone",
    "General Email",
    "Purchasing Email",
    "Manager",
    "Purchasing Person",
    "Product Portfolio",
    "Specialty",
    "Customer Types",
    "Product Types",
    "Sourcing",
    "Export Sales",
    "Special Focus",
    "Product Keywords",
    "Number of Sales Points",
]

// Exemplo para o template
export const MARKETPLACE_CSV_TEMPLATE_EXAMPLE = [
    "Netherlands",
    "FMCG Import Office",
    "Importer FMCG",
    "FMCG (food)",
    "https://fmcgimport.com/",
    "",
    "31 475 202154",
    "",
    "sales@fmcgimport.eu",
    "",
    "",
    "",
    "Food & Beverages, Household, Cosmetics, Sweets",
    "Full range",
    "Wholesale / Supermarkets",
    "Branded products",
    "worldwide",
    "worldwide",
    "",
    "",
    "",
]

// Tipo para os dados do lead
export type MarketplaceLeadData = {
    country: string
    companyName: string
    emailGeneral?: string
    companyType?: string
    sector?: string
    website?: string
    contactForm?: string
    phoneGeneral?: string
    phonePurchasing?: string
    emailPurchasing?: string
    manager?: string
    purchasingPerson?: string
    productPortfolio?: string
    specialty?: string
    customerTypes?: string
    productTypes?: string
    sourcing?: string
    exportSales?: string
    specialFocus?: string
    productKeywords?: string
    salesPointsCount?: string
}

/**
 * Normaliza string para comparação
 */
function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[-_\s.]+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
}

/**
 * Auto-mapeia uma coluna do CSV para um campo do marketplace
 */
export function autoMapMarketplaceColumn(columnName: string): string | null {
    const normalized = normalizeString(columnName)

    // 1. Match exato com key
    const exactKeyMatch = MARKETPLACE_CSV_FIELDS.find(
        (f) => normalizeString(f.key) === normalized
    )
    if (exactKeyMatch) return exactKeyMatch.key

    // 2. Match exato com label
    const exactLabelMatch = MARKETPLACE_CSV_FIELDS.find(
        (f) => normalizeString(f.label) === normalized
    )
    if (exactLabelMatch) return exactLabelMatch.key

    // 3. Match com aliases
    for (const field of MARKETPLACE_CSV_FIELDS) {
        const normalizedAliases = field.aliases.map(normalizeString)
        if (normalizedAliases.includes(normalized)) {
            return field.key
        }
    }

    // 4. Match parcial
    for (const field of MARKETPLACE_CSV_FIELDS) {
        for (const alias of field.aliases) {
            const normalizedAlias = normalizeString(alias)
            if (normalizedAlias.length >= 3 && normalized.length >= 3) {
                if (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)) {
                    return field.key
                }
            }
        }
    }

    return null
}

/**
 * Verifica se uma string parece ser um email válido
 */
function isValidEmail(email: string): boolean {
    if (!email) return false

    const trimmed = email.trim().toLowerCase()

    // Ignorar valores que claramente não são emails
    const invalidValues = [
        "contact form",
        "contactform",
        "form",
        "n/a",
        "na",
        "none",
        "-",
        "--",
        "não informado",
        "not available",
        "see website",
        "website",
        "ver site",
        "siehe website",
        "voir site",
    ]

    if (invalidValues.includes(trimmed)) {
        return false
    }

    // Se não contém @, não é email
    if (!trimmed.includes("@")) {
        return false
    }

    // Verificar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(trimmed)
}

/**
 * Valida se um lead tem os campos MÍNIMOS obrigatórios
 */
export function validateMarketplaceLead(lead: Partial<MarketplaceLeadData>): {
    valid: boolean
    errors: string[]
    isComplete: boolean
} {
    const errors: string[] = []

    // Campos realmente obrigatórios
    if (!lead.country?.trim()) {
        errors.push("Country is required")
    }
    if (!lead.companyName?.trim()) {
        errors.push("Company Name is required")
    }

    // Verificar se tem email válido (não é obrigatório, mas determina se é "completo")
    const emailValue = lead.emailGeneral?.trim() || ""
    const hasValidEmail = isValidEmail(emailValue)

    // Lead é "completo" se tem um email válido
    const isComplete = hasValidEmail

    return {
        valid: errors.length === 0,
        errors,
        isComplete,
    }
}