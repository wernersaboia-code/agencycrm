// lib/constants/csv-mapping.constants.ts

export interface MappableField {
    key: string
    label: string
    required: boolean
    description: string
    examples: string[]
}

export const MAPPABLE_FIELDS: MappableField[] = [
    // Contato (obrigatórios/importantes)
    {
        key: 'firstName',
        label: 'Nome',
        required: true,
        description: 'Primeiro nome do contato',
        examples: ['João', 'Maria', 'Hans'],
    },
    {
        key: 'lastName',
        label: 'Sobrenome',
        required: false,
        description: 'Sobrenome do contato',
        examples: ['Silva', 'Santos', 'Müller'],
    },
    {
        key: 'email',
        label: 'Email',
        required: true,
        description: 'Email do contato (obrigatório)',
        examples: ['joao@empresa.com', 'contato@firma.de'],
    },
    {
        key: 'phone',
        label: 'Telefone',
        required: false,
        description: 'Telefone fixo',
        examples: ['+55 11 3333-4444', '+49 30 12345678'],
    },
    {
        key: 'mobile',
        label: 'Celular',
        required: false,
        description: 'Telefone celular',
        examples: ['+55 11 99999-8888', '+49 170 1234567'],
    },

    // Empresa
    {
        key: 'company',
        label: 'Empresa',
        required: false,
        description: 'Nome da empresa',
        examples: ['Empresa XYZ Ltda', 'Firma GmbH'],
    },
    {
        key: 'jobTitle',
        label: 'Cargo',
        required: false,
        description: 'Cargo ou função',
        examples: ['Diretor', 'Gerente de Vendas', 'CEO'],
    },
    {
        key: 'website',
        label: 'Website',
        required: false,
        description: 'Site da empresa',
        examples: ['https://empresa.com', 'www.firma.de'],
    },
    {
        key: 'taxId',
        label: 'CNPJ/VAT',
        required: false,
        description: 'Identificador fiscal (CNPJ, VAT, etc)',
        examples: ['12.345.678/0001-90', 'DE123456789'],
    },
    {
        key: 'industry',
        label: 'Segmento',
        required: false,
        description: 'Segmento ou indústria',
        examples: ['Tecnologia', 'Varejo', 'Saúde'],
    },
    {
        key: 'companySize',
        label: 'Porte da Empresa',
        required: false,
        description: 'Tamanho da empresa (MICRO, SMALL, MEDIUM, LARGE, ENTERPRISE)',
        examples: ['SMALL', 'MEDIUM', 'LARGE'],
    },

    // Localização
    {
        key: 'address',
        label: 'Endereço',
        required: false,
        description: 'Endereço completo',
        examples: ['Rua das Flores, 123', 'Hauptstraße 45'],
    },
    {
        key: 'city',
        label: 'Cidade',
        required: false,
        description: 'Cidade',
        examples: ['São Paulo', 'Berlin', 'Lisboa'],
    },
    {
        key: 'state',
        label: 'Estado/Região',
        required: false,
        description: 'Estado, província ou região',
        examples: ['SP', 'Bayern', 'California'],
    },
    {
        key: 'postalCode',
        label: 'CEP/Código Postal',
        required: false,
        description: 'Código postal',
        examples: ['01234-567', '10115', '90210'],
    },
    {
        key: 'country',
        label: 'País',
        required: false,
        description: 'Código do país (2 letras)',
        examples: ['BR', 'DE', 'US', 'PT'],
    },

    // Outros
    {
        key: 'notes',
        label: 'Notas',
        required: false,
        description: 'Observações sobre o contato',
        examples: ['Cliente antigo', 'Indicação do João'],
    },
]

// Aliases comuns para auto-mapeamento
export const FIELD_ALIASES: Record<string, string[]> = {
    firstName: ['nome', 'first_name', 'first name', 'nome_contato', 'primeironome', 'vorname'],
    lastName: ['sobrenome', 'last_name', 'last name', 'segundo_nome', 'nachname'],
    email: ['e-mail', 'email_address', 'correio', 'e_mail', 'mail'],
    phone: ['telefone', 'tel', 'fone', 'phone_number', 'telefon'],
    mobile: ['celular', 'cel', 'mobile_phone', 'whatsapp', 'handy'],
    company: ['empresa', 'company_name', 'firma', 'organization', 'organização', 'unternehmen'],
    jobTitle: ['cargo', 'job_title', 'position', 'função', 'titulo', 'position', 'beruf'],
    website: ['site', 'web', 'url', 'homepage', 'webpage'],
    taxId: ['cnpj', 'cpf', 'vat', 'tax_id', 'ein', 'nif', 'steuernummer'],
    industry: ['segmento', 'setor', 'industria', 'ramo', 'branche'],
    companySize: ['porte', 'tamanho', 'size', 'employees', 'funcionarios', 'größe'],
    address: ['endereco', 'endereço', 'logradouro', 'rua', 'street', 'straße', 'adresse'],
    city: ['cidade', 'municipio', 'município', 'town', 'stadt', 'ort'],
    state: ['estado', 'uf', 'provincia', 'province', 'region', 'bundesland'],
    postalCode: ['cep', 'zip', 'zip_code', 'postal_code', 'codigo_postal', 'plz', 'postleitzahl'],
    country: ['pais', 'país', 'land', 'nation'],
    notes: ['notas', 'observacao', 'observação', 'obs', 'comments', 'comentarios', 'anmerkungen'],
}

/**
 * Tenta encontrar o campo correspondente baseado no nome da coluna
 */
export function autoMapColumn(columnName: string): string | null {
    const normalized = columnName.toLowerCase().trim()

    // Primeiro tenta match exato
    const exactMatch = MAPPABLE_FIELDS.find(
        f => f.key.toLowerCase() === normalized || f.label.toLowerCase() === normalized
    )
    if (exactMatch) return exactMatch.key

    // Depois tenta aliases
    for (const [fieldKey, aliases] of Object.entries(FIELD_ALIASES)) {
        if (aliases.some(alias => normalized.includes(alias) || alias.includes(normalized))) {
            return fieldKey
        }
    }

    return null
}