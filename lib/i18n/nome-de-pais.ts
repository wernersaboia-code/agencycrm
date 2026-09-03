// lib/i18n/nome-de-pais.ts

/**
 * Nome e validação de país, a partir do ICU do runtime.
 *
 * País NÃO é vocabulário deste projeto — é padrão internacional, e o runtime
 * já o conhece nos sete idiomas. Antes havia uma lista curada à mão
 * (`COUNTRY_CODES`) mais 53 rótulos × 7 arquivos de mensagem; ela vivia
 * atrasada em relação ao catálogo, e país sem entrada nela ficava publicado e
 * invisível no filtro. Conferido antes de trocar: dos 378 rótulos escritos à
 * mão, 371 eram idênticos ao que o `Intl.DisplayNames` devolve.
 *
 * Setor continua curado à mão, e deve continuar: "HoReCa" e "FMCG" são
 * vocabulário do negócio, não padrão de ninguém.
 */

/**
 * Códigos que o ICU aceita mas que NÃO podem entrar no catálogo, com o código
 * vivo de cada um.
 *
 * São aliases históricos que o `Intl.DisplayNames` resolve em silêncio: `UK`
 * devolve "Reino Unido", `SU` devolve "Rússia", `YU` devolve "Sérvia". Aceitar
 * qualquer um cria DUAS facetas para o mesmo país — o estudo marcado `SU` nunca
 * apareceria junto dos marcados `RU`.
 *
 * A lista é fechada e não cresce com o catálogo: veio de varrer os 280 códigos
 * que o ICU aceita e agrupar os que compartilham nome.
 */
const CODIGO_OBSOLETO: Record<string, string> = {
    AN: "CW", BU: "MM", CS: "RS", DD: "DE", DY: "BJ", FX: "FR",
    HV: "BF", NH: "VU", RH: "ZW", SU: "RU", TP: "TL", UK: "GB",
    VD: "VN", YD: "YE", YU: "RS", ZR: "CD",
}

/**
 * Agrupamentos e códigos de teste que o ICU traduz como se fossem lugares.
 * `EU` é a União Europeia, `ZZ` é "região desconhecida", `XA`/`XB` são os
 * pseudo-idiomas que o próprio ICU usa para testar layout.
 */
const NAO_E_PAIS = new Set(["EU", "EZ", "QO", "XA", "XB", "ZZ"])

/**
 * Os poucos nomes em que o projeto discorda do ICU, por idioma.
 *
 * Levantados comparando os 378 rótulos que eram escritos à mão com o que o
 * runtime devolve: 371 batiam. Sobram estes — e são preferências editoriais,
 * não erros do ICU: "Holanda" é o que o público brasileiro usa, e o site já
 * dizia "República Tcheca" antes de a forma curta virar padrão.
 *
 * NÃO ficam nos arquivos de mensagem, e a razão é concreta: com o bloco vazio
 * em alemão, o next-intl caía no idioma padrão e a página alemã exibia
 * "Holanda" e "República Tcheca". Aqui cada idioma responde por si, e um mapa
 * ausente é ausente mesmo.
 */
const EXCECOES_POR_IDIOMA: Record<string, Record<string, string>> = {
    pt: { CZ: "República Tcheca", NL: "Holanda" },
    en: { CZ: "Czech Republic", TR: "Turkey" },
    es: { CZ: "República Checa" },
    fr: { CZ: "République tchèque" },
    it: { CZ: "Repubblica Ceca" },
    de: {},
    nl: {},
}

export function excecoesDoIdioma(locale: string): Record<string, string> {
    return EXCECOES_POR_IDIOMA[locale] ?? {}
}

/** Construir um `DisplayNames` é caro; um por idioma basta para a página toda. */
const cachePorIdioma = new Map<string, Intl.DisplayNames | null>()

function tradutor(locale: string): Intl.DisplayNames | null {
    if (!cachePorIdioma.has(locale)) {
        try {
            cachePorIdioma.set(
                locale,
                new Intl.DisplayNames([locale], { type: "region", fallback: "none" })
            )
        } catch {
            // Navegador sem Intl.DisplayNames (anterior a 2020). Degrada para o
            // código cru em vez de derrubar a página.
            cachePorIdioma.set(locale, null)
        }
    }
    return cachePorIdioma.get(locale) ?? null
}

export function normalizaCodigoDePais(bruto: string): string {
    return bruto.trim().toUpperCase()
}

/**
 * Nome do país no idioma pedido.
 *
 * `excecoes` são os poucos rótulos em que o projeto discorda do ICU — "Holanda"
 * em vez de "Países Baixos", "República Tcheca" em vez de "Tchéquia". Ficam em
 * `catalog.countryOverrides` nos arquivos de mensagem, e só precisam existir
 * onde há discordância.
 *
 * Código que o runtime não sabe traduzir volta como veio: uma faceta com nome
 * feio é muito melhor que uma tela quebrada.
 */
export function nomeDePais(
    codigo: string,
    locale: string,
    excecoes: Record<string, string> = {}
): string {
    const code = normalizaCodigoDePais(codigo)
    return excecoes[code] ?? tradutor(locale)?.of(code) ?? code
}

/**
 * Os códigos ruins de um campo separado por vírgula, sem repetição.
 *
 * Feito para o campo de país do admin, que é texto livre e vem auto-preenchido
 * dos leads do PDF. Pedaço vazio não é erro: `"DE,"` é só alguém no meio da
 * digitação, e acusar isso faria o aviso piscar a cada vírgula.
 */
export function paisesInvalidosDoCampo(campo: string): string[] {
    const vistos = new Set<string>()
    const ruins: string[] = []

    for (const pedaco of campo.split(",")) {
        const code = normalizaCodigoDePais(pedaco)
        if (!code || vistos.has(code)) continue
        vistos.add(code)
        if (!validaCodigoDePais(code).ok) ruins.push(code)
    }

    return ruins
}

export type ValidacaoDePais = { ok: true } | { ok: false; motivo: string }

/**
 * O código representa um país de verdade?
 *
 * Pergunta deliberadamente diferente de "está na minha lista": qualquer país do
 * mundo passa, sem cadastro prévio, porque o catálogo cresce para onde os
 * estudos forem. O que não passa é o que sujaria o filtro — código inventado,
 * alias obsoleto e agrupamento que não é país.
 */
export function validaCodigoDePais(bruto: string): ValidacaoDePais {
    const code = normalizaCodigoDePais(bruto)

    if (!/^[A-Z]{2}$/.test(code)) {
        return {
            ok: false,
            motivo: `"${bruto}" não é um código de país: use as duas letras do padrão ISO, como BR, DE ou ZA.`,
        }
    }

    const atual = CODIGO_OBSOLETO[code]
    if (atual) {
        return {
            ok: false,
            motivo: `"${code}" é um código antigo; o código atual desse país é ${atual}. Usar os dois criaria duas opções separadas para o mesmo país no filtro.`,
        }
    }

    if (NAO_E_PAIS.has(code) || !tradutor("en")?.of(code)) {
        return {
            ok: false,
            motivo: `"${code}" não corresponde a nenhum país. Confira o código no estudo — o filtro do catálogo não teria o que mostrar.`,
        }
    }

    return { ok: true }
}
