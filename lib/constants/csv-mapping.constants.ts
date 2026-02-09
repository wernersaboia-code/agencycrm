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

// ============================================================
// ALIASES PARA AUTO-MAPEAMENTO
// Inclui variações em português, inglês, alemão, francês, espanhol
// ============================================================

export const FIELD_ALIASES: Record<string, string[]> = {
    firstName: [
        // Português
        'nome', 'primeiro_nome', 'primeironome', 'nome_contato', 'contato',
        // Inglês
        'first_name', 'firstname', 'first name', 'name', 'given_name', 'givenname',
        // Alemão
        'vorname', 'vor_name',
        // Francês
        'prenom', 'prénom', 'pre_nom',
        // Espanhol
        'nombre', 'primer_nombre',
    ],
    lastName: [
        // Português
        'sobrenome', 'ultimo_nome', 'ultimonome', 'segundo_nome',
        // Inglês
        'last_name', 'lastname', 'last name', 'surname', 'family_name', 'familyname',
        // Alemão
        'nachname', 'nach_name', 'familienname',
        // Francês
        'nom', 'nom_famille',
        // Espanhol
        'apellido', 'apellidos',
    ],
    email: [
        // Variações comuns
        'e-mail', 'e_mail', 'e mail', 'mail', 'email_address', 'emailaddress',
        // Português
        'correio', 'correio_eletronico', 'endereco_email',
        // Inglês
        'email address', 'electronic_mail',
        // Alemão
        'e-mail-adresse', 'emailadresse', 'mail_adresse', 'mailadresse',
        // Francês
        'courriel', 'adresse_email', 'adresse_mail',
        // Espanhol
        'correo', 'correo_electronico', 'direccion_email',
    ],
    phone: [
        // Português
        'telefone', 'tel', 'fone', 'telefone_fixo', 'fixo',
        // Inglês
        'phone', 'phone_number', 'phonenumber', 'telephone', 'landline',
        // Alemão
        'telefon', 'telefonnummer', 'festnetz', 'festnetznummer',
        // Francês
        'téléphone', 'telephone', 'tel_fixe',
        // Espanhol
        'telefono', 'teléfono', 'numero_telefono',
    ],
    mobile: [
        // Português
        'celular', 'cel', 'movel', 'móvel', 'telefone_celular',
        // Inglês
        'mobile', 'mobile_phone', 'mobilephone', 'cell', 'cellphone', 'cell_phone',
        // Alemão
        'handy', 'handynummer', 'mobiltelefon', 'mobil',
        // Francês
        'portable', 'tel_portable', 'mobile',
        // Espanhol
        'movil', 'móvil', 'celular',
        // Apps
        'whatsapp', 'whats',
    ],
    company: [
        // Português
        'empresa', 'companhia', 'organizacao', 'organização', 'razao_social', 'razão_social',
        // Inglês
        'company', 'company_name', 'companyname', 'organization', 'organisation', 'org', 'business',
        // Alemão
        'firma', 'unternehmen', 'firmenname', 'betrieb', 'gesellschaft',
        // Francês
        'entreprise', 'société', 'societe', 'nom_entreprise',
        // Espanhol
        'empresa', 'compañia', 'compania', 'organizacion',
    ],
    jobTitle: [
        // Português
        'cargo', 'funcao', 'função', 'titulo', 'título', 'posicao', 'posição',
        // Inglês
        'job_title', 'jobtitle', 'title', 'position', 'role', 'job', 'occupation',
        // Alemão
        'position', 'beruf', 'berufsbezeichnung', 'stelle', 'jobtitel',
        // Francês
        'poste', 'fonction', 'titre', 'metier', 'métier',
        // Espanhol
        'cargo', 'puesto', 'titulo', 'posicion',
    ],
    website: [
        'site', 'web', 'url', 'homepage', 'webpage', 'website',
        'pagina', 'página', 'sitio', 'webseite', 'internetseite', 'site_web',
    ],
    taxId: [
        // Brasil
        'cnpj', 'cpf', 'inscricao', 'inscrição',
        // Internacional
        'tax_id', 'taxid', 'vat', 'vat_number', 'vatnumber', 'ein', 'nif', 'cif',
        // Alemão
        'steuernummer', 'steuer_id', 'ust_id', 'ustid', 'umsatzsteuer_id',
        // Francês
        'siret', 'siren', 'numero_fiscal',
        // Espanhol
        'nif', 'cif', 'rfc',
    ],
    industry: [
        // Português
        'segmento', 'setor', 'industria', 'indústria', 'ramo', 'area', 'área',
        // Inglês
        'industry', 'sector', 'field', 'business_type',
        // Alemão
        'branche', 'industriezweig', 'sektor', 'geschaeftsbereich',
        // Francês
        'secteur', 'industrie', 'domaine',
        // Espanhol
        'sector', 'industria', 'ramo',
    ],
    companySize: [
        // Português
        'porte', 'tamanho', 'tamanho_empresa', 'num_funcionarios', 'funcionarios', 'funcionários',
        // Inglês
        'size', 'company_size', 'companysize', 'employees', 'num_employees', 'headcount',
        // Alemão
        'größe', 'groesse', 'mitarbeiter', 'mitarbeiterzahl', 'unternehmensgröße',
        // Francês
        'taille', 'effectif', 'nombre_employes',
        // Espanhol
        'tamaño', 'tamano', 'empleados', 'num_empleados',
    ],
    address: [
        // Português
        'endereco', 'endereço', 'logradouro', 'rua', 'endereco_completo',
        // Inglês
        'address', 'street', 'street_address', 'location',
        // Alemão
        'adresse', 'anschrift', 'straße', 'strasse', 'str',
        // Francês
        'adresse', 'rue', 'voie',
        // Espanhol
        'direccion', 'dirección', 'calle', 'domicilio',
    ],
    city: [
        // Português
        'cidade', 'municipio', 'município', 'localidade',
        // Inglês
        'city', 'town', 'locality',
        // Alemão
        'stadt', 'ort', 'gemeinde',
        // Francês
        'ville', 'commune', 'localité',
        // Espanhol
        'ciudad', 'municipio', 'localidad',
    ],
    state: [
        // Português
        'estado', 'uf', 'provincia', 'província', 'regiao', 'região',
        // Inglês
        'state', 'province', 'region', 'county',
        // Alemão
        'bundesland', 'land', 'region',
        // Francês
        'region', 'région', 'departement', 'département', 'province',
        // Espanhol
        'estado', 'provincia', 'region', 'comunidad',
    ],
    postalCode: [
        // Português
        'cep', 'codigo_postal', 'código_postal',
        // Inglês
        'zip', 'zip_code', 'zipcode', 'postal_code', 'postalcode', 'postal', 'postcode',
        // Alemão
        'plz', 'postleitzahl',
        // Francês
        'code_postal', 'codepostal', 'cp',
        // Espanhol
        'codigo_postal', 'cp',
    ],
    country: [
        // Português
        'pais', 'país', 'nacao', 'nação',
        // Inglês
        'country', 'nation', 'country_code',
        // Alemão
        'land', 'staat',
        // Francês
        'pays',
        // Espanhol
        'pais', 'país',
    ],
    notes: [
        // Português
        'notas', 'nota', 'observacao', 'observação', 'observacoes', 'observações', 'obs',
        // Inglês
        'notes', 'note', 'comments', 'comment', 'remarks', 'description', 'info',
        // Alemão
        'notizen', 'anmerkungen', 'bemerkungen', 'kommentar', 'hinweise',
        // Francês
        'notes', 'remarques', 'commentaires', 'observations',
        // Espanhol
        'notas', 'observaciones', 'comentarios',
    ],
}

// ============================================================
// FUNÇÃO DE AUTO-MAPEAMENTO
// ============================================================

/**
 * Normaliza uma string para comparação
 * Remove acentos, converte para minúsculas, normaliza separadores
 */
function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[-_\s.]+/g, '_') // Normaliza separadores para underscore
        .replace(/[^a-z0-9_]/g, '') // Remove caracteres especiais
}

/**
 * Tenta encontrar o campo correspondente baseado no nome da coluna
 */
export function autoMapColumn(columnName: string): string | null {
    const normalized = normalizeString(columnName)

    // 1. Primeiro tenta match exato com key do campo
    const exactKeyMatch = MAPPABLE_FIELDS.find(
        f => normalizeString(f.key) === normalized
    )
    if (exactKeyMatch) return exactKeyMatch.key

    // 2. Tenta match exato com label do campo
    const exactLabelMatch = MAPPABLE_FIELDS.find(
        f => normalizeString(f.label) === normalized
    )
    if (exactLabelMatch) return exactLabelMatch.key

    // 3. Tenta match exato com aliases
    for (const [fieldKey, aliases] of Object.entries(FIELD_ALIASES)) {
        const normalizedAliases = aliases.map(normalizeString)
        if (normalizedAliases.includes(normalized)) {
            return fieldKey
        }
    }

    // 4. Tenta match parcial (coluna contém alias ou alias contém coluna)
    for (const [fieldKey, aliases] of Object.entries(FIELD_ALIASES)) {
        for (const alias of aliases) {
            const normalizedAlias = normalizeString(alias)
            // Só faz match parcial se tiver pelo menos 3 caracteres
            if (normalizedAlias.length >= 3 && normalized.length >= 3) {
                if (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)) {
                    return fieldKey
                }
            }
        }
    }

    return null
}

// ============================================================
// TEMPLATE DE IMPORTAÇÃO
// ============================================================

export const IMPORT_TEMPLATE_HEADERS = [
    'Nome',
    'Sobrenome',
    'Email',
    'Telefone',
    'Celular',
    'Empresa',
    'Cargo',
    'Website',
    'Segmento',
    'Cidade',
    'Estado',
    'País',
    'Observações',
]

export const IMPORT_TEMPLATE_EXAMPLE = [
    'João',
    'Silva',
    'joao.silva@empresa.com',
    '+55 11 3333-4444',
    '+55 11 99999-8888',
    'Tech Solutions',
    'Diretor Comercial',
    'www.techsolutions.com.br',
    'Tecnologia',
    'São Paulo',
    'SP',
    'BR',
    'Cliente em potencial - contato via LinkedIn',
]