// lib/constants/countries.constants.ts

/**
 * Mapa de código ISO para nome do país em português
 * Usado nos relatórios PDF (que não suportam emojis)
 */
export const COUNTRY_NAMES: Record<string, string> = {
    // América do Sul
    AR: "Argentina",
    BO: "Bolivia",
    BR: "Brasil",
    CL: "Chile",
    CO: "Colombia",
    EC: "Equador",
    GY: "Guiana",
    PY: "Paraguai",
    PE: "Peru",
    SR: "Suriname",
    UY: "Uruguai",
    VE: "Venezuela",

    // América do Norte e Central
    CA: "Canada",
    US: "Estados Unidos",
    MX: "Mexico",
    CR: "Costa Rica",
    CU: "Cuba",
    DO: "Rep. Dominicana",
    GT: "Guatemala",
    HN: "Honduras",
    JM: "Jamaica",
    NI: "Nicaragua",
    PA: "Panama",
    PR: "Porto Rico",
    SV: "El Salvador",

    // Europa Ocidental
    AT: "Austria",
    BE: "Belgica",
    CH: "Suica",
    DE: "Alemanha",
    FR: "Franca",
    GB: "Reino Unido",
    UK: "Reino Unido",
    IE: "Irlanda",
    LU: "Luxemburgo",
    MC: "Monaco",
    NL: "Holanda",

    // Europa do Sul
    AD: "Andorra",
    ES: "Espanha",
    GR: "Grecia",
    IT: "Italia",
    MT: "Malta",
    PT: "Portugal",
    SM: "San Marino",
    VA: "Vaticano",

    // Europa do Norte
    DK: "Dinamarca",
    EE: "Estonia",
    FI: "Finlandia",
    IS: "Islandia",
    LT: "Lituania",
    LV: "Letonia",
    NO: "Noruega",
    SE: "Suecia",

    // Europa Oriental
    AL: "Albania",
    BA: "Bosnia",
    BG: "Bulgaria",
    BY: "Bielorrussia",
    CZ: "Republica Tcheca",
    HR: "Croacia",
    HU: "Hungria",
    MD: "Moldavia",
    ME: "Montenegro",
    MK: "Macedonia do Norte",
    PL: "Polonia",
    RO: "Romenia",
    RS: "Servia",
    RU: "Russia",
    SI: "Eslovenia",
    SK: "Eslovaquia",
    UA: "Ucrania",

    // Ásia
    AE: "Emirados Arabes",
    AF: "Afeganistao",
    BD: "Bangladesh",
    BH: "Bahrein",
    CN: "China",
    HK: "Hong Kong",
    ID: "Indonesia",
    IL: "Israel",
    IN: "India",
    IQ: "Iraque",
    IR: "Ira",
    JP: "Japao",
    JO: "Jordania",
    KR: "Coreia do Sul",
    KP: "Coreia do Norte",
    KW: "Kuwait",
    KZ: "Cazaquistao",
    LB: "Libano",
    MY: "Malasia",
    OM: "Oma",
    PH: "Filipinas",
    PK: "Paquistao",
    QA: "Catar",
    SA: "Arabia Saudita",
    SG: "Singapura",
    SY: "Siria",
    TH: "Tailandia",
    TR: "Turquia",
    TW: "Taiwan",
    UZ: "Uzbequistao",
    VN: "Vietna",

    // África
    AO: "Angola",
    BW: "Botsuana",
    CD: "Congo",
    CI: "Costa do Marfim",
    CM: "Camaroes",
    CV: "Cabo Verde",
    DZ: "Argelia",
    EG: "Egito",
    ET: "Etiopia",
    GH: "Gana",
    GW: "Guine-Bissau",
    KE: "Quenia",
    LY: "Libia",
    MA: "Marrocos",
    MZ: "Mocambique",
    NG: "Nigeria",
    RW: "Ruanda",
    SN: "Senegal",
    ST: "Sao Tome e Principe",
    TN: "Tunisia",
    TZ: "Tanzania",
    UG: "Uganda",
    ZA: "Africa do Sul",
    ZM: "Zambia",
    ZW: "Zimbabwe",

    // Oceania
    AU: "Australia",
    FJ: "Fiji",
    NZ: "Nova Zelandia",
    PG: "Papua Nova Guine",

    // Nomes em alemão (para seu padrasto! 😄)
    // Se ele digitar em alemão, também funciona
    DEUTSCHLAND: "Alemanha",
    BRASILIEN: "Brasil",
    SPANIEN: "Espanha",
    FRANKREICH: "Franca",
    ITALIEN: "Italia",
    PORTUGAL: "Portugal",
    OSTERREICH: "Austria",
    SCHWEIZ: "Suica",
    NIEDERLANDE: "Holanda",
    BELGIEN: "Belgica",
    VEREINIGTE_STAATEN: "Estados Unidos",
    VEREINIGTES_KONIGREICH: "Reino Unido",
}

/**
 * Retorna o nome do país em português
 * Se não encontrar, retorna o código original
 */
export function getCountryName(code: string | null | undefined): string {
    if (!code) return ""

    // Tenta buscar pelo código (uppercase)
    const upperCode = code.toUpperCase().trim()

    if (COUNTRY_NAMES[upperCode]) {
        return COUNTRY_NAMES[upperCode]
    }

    // Se não encontrou, retorna o próprio código/nome
    return code
}