// lib/marketplace/continentes.ts

/**
 * Continente de cada país, para a seção de mercados-alvo da home.
 *
 * Por que uma tabela à mão, num projeto que acabou de tirar país do vocabulário
 * curado: continente NÃO é derivável do runtime. O `Intl.DisplayNames` traduz
 * nomes de país, mas não sabe em que continente cada um fica, e não existe outra
 * fonte no ambiente. A diferença para a lista curada que foi removida é que esta
 * aqui é FECHADA: o conjunto de países do mundo não cresce com o catálogo, então
 * ela não envelhece quando um estudo novo é publicado.
 *
 * O que a mantém honesta é o teste ao lado: ele percorre todos os países do mapa
 * gerado e falha se algum ficar sem continente. Um país que caísse fora sumiria
 * da contagem em silêncio — que é exatamente o defeito que a lista antiga tinha.
 *
 * O agrupamento segue a UN M49, e isso tem consequências que valem saber antes
 * de "corrigir": Turquia, Chipre, Armênia, Azerbaijão e Geórgia contam como
 * ÁSIA; Rússia conta como EUROPA. América Central e Caribe entram em América do
 * Norte, porque a seção fala em continentes e não nas 22 sub-regiões da M49.
 * Antártida não aparece: não tem importador, e o mapa gerado já a exclui.
 */

export const CONTINENTES = [
    "europa",
    "asia",
    "americaDoNorte",
    "americaDoSul",
    "africa",
    "oceania",
] as const

export type Continente = (typeof CONTINENTES)[number]

const PAISES_POR_CONTINENTE: Record<Continente, readonly string[]> = {
    europa: [
        "AD", "AL", "AT", "AX", "BA", "BE", "BG", "BY", "CH", "CZ", "DE", "DK",
        "EE", "ES", "FI", "FO", "FR", "GB", "GG", "GI", "GR", "HR", "HU", "IE",
        "IM", "IS", "IT", "JE", "LI", "LT", "LU", "LV", "MC", "MD", "ME", "MK",
        "MT", "NL", "NO", "PL", "PT", "RO", "RS", "RU", "SE", "SI", "SJ", "SK",
        "SM", "UA", "VA",
    ],
    asia: [
        "AE", "AF", "AM", "AZ", "BD", "BH", "BN", "BT", "CC", "CN", "CX", "CY",
        "GE", "HK", "ID", "IL", "IN", "IQ", "IR", "JO", "JP", "KG", "KH", "KP",
        "KR", "KW", "KZ", "LA", "LB", "LK", "MM", "MN", "MO", "MV", "MY", "NP",
        "OM", "PH", "PK", "PS", "QA", "SA", "SG", "SY", "TH", "TJ", "TL", "TM",
        "TR", "TW", "UZ", "VN", "YE",
    ],
    americaDoNorte: [
        "AG", "AI", "AW", "BB", "BL", "BM", "BQ", "BS", "BZ", "CA", "CR", "CU",
        "CW", "DM", "DO", "GD", "GL", "GP", "GT", "HN", "HT", "JM", "KN", "KY",
        "LC", "MF", "MQ", "MS", "MX", "NI", "PA", "PM", "PR", "SV", "SX", "TC",
        "TT", "US", "VC", "VG", "VI",
    ],
    americaDoSul: [
        "AR", "BO", "BR", "CL", "CO", "EC", "FK", "GF", "GS", "GY", "PE", "PY",
        "SR", "UY", "VE",
    ],
    africa: [
        "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ",
        "DZ", "EG", "EH", "ER", "ET", "GA", "GH", "GM", "GN", "GQ", "GW", "IO",
        "KE", "KM", "LR", "LS", "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ",
        "NA", "NE", "NG", "RE", "RW", "SC", "SD", "SH", "SL", "SN", "SO", "SS",
        "ST", "SZ", "TD", "TF", "TG", "TN", "TZ", "UG", "YT", "ZA", "ZM", "ZW",
    ],
    oceania: [
        // HM (Ilhas Heard e McDonald) é desabitada, mas está no world-atlas e
        // portanto no mapa: sem entrada aqui o teste de cobertura falha.
        "AS", "AU", "CK", "FJ", "FM", "GU", "HM", "KI", "MH", "MP", "NC", "NF", "NR",
        "NU", "NZ", "PF", "PG", "PN", "PW", "SB", "TK", "TO", "TV", "UM", "VU",
        "WF", "WS",
    ],
}

const CONTINENTE_DO_PAIS: Map<string, Continente> = new Map()
for (const continente of CONTINENTES) {
    for (const code of PAISES_POR_CONTINENTE[continente]) {
        CONTINENTE_DO_PAIS.set(code, continente)
    }
}

/**
 * `null` para código que a tabela não conhece.
 *
 * Devolver `null` em vez de chutar um continente é deliberado: quem chama
 * decide o que fazer com o desconhecido, e o teste garante que isso não
 * acontece com nenhum país do mapa.
 */
export function continenteDoPais(code: string): Continente | null {
    return CONTINENTE_DO_PAIS.get(code.trim().toUpperCase()) ?? null
}

export function paisesDoContinente(continente: Continente): readonly string[] {
    return PAISES_POR_CONTINENTE[continente]
}
