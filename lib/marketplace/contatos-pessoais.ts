// lib/marketplace/contatos-pessoais.ts
//
// Detecta contato PESSOAL dentro do texto de um estudo antes de ele ir ao ar.
//
// Por que isto existe: o Paddle reprovou o domínio enquadrando o site em
// "Direct Marketing Services". O que faz um diretório setorial virar lista de
// prospecção não é citar empresas nem nomear um diretor — nome e cargo de
// sócio-gerente é registro comercial público. É publicar o CANAL PESSOAL da
// pessoa: e-mail nominal e telefone direto. Além do enquadramento, é isso que
// expõe o comprador ao §7 da UWG alemã, que não abre exceção para B2B.
//
// As regras abaixo foram calibradas contra os 51 estudos reais do catálogo,
// e cada afrouxamento aqui é um falso positivo que apareceu naquela revisão —
// não suposição:
//   - "direct line" aparece em PROSA ("rather than a guaranteed direct line"),
//     então só conta com telefone na mesma linha;
//   - servizio.clienti@, asiakaspalvelu.metro@ e kayttotavara.meiranova@ são
//     atendimento em italiano e finlandês, não pessoas;
//   - hellin.ee@hellin.eu repete o domínio no local part: é caixa da empresa;
//   - firstname.lastname@ e yourbrand@ são placeholder de template.

export type TipoAchado = "email_pessoal" | "telefone_direto" | "pessoa_nomeada"

export type Achado = {
    tipo: TipoAchado
    /** O e-mail, o nome ou o trecho que disparou. */
    valor: string
    /** A linha inteira, para o admin julgar sem abrir o PDF. */
    contexto: string
}

/**
 * Local parts que são função, não pessoa. Inclui os idiomas do catálogo —
 * um estudo tcheco traz "obchod", um finlandês traz "asiakaspalvelu", e sem
 * eles a validação vira ruído e o admin aprende a ignorar o aviso.
 */
const CAIXAS_FUNCIONAIS = new Set([
    "info", "kontakt", "contact", "contato", "contacto", "mail", "email",
    "office", "buero", "bureau", "sales", "verkauf", "vertrieb", "verkoop",
    "einkauf", "zentraleinkauf", "purchasing", "purchase", "purchasers",
    "service", "servizio", "clienti", "support", "hello", "zentrale", "admin",
    "order", "orders", "ordini", "bestellung", "bestellungen", "auftrag",
    "anfrage", "anfragen", "request", "export", "import", "marketing",
    "presse", "press", "team", "post", "reception", "empfang", "central",
    "centrale", "general", "geral", "comercial", "commercial", "pedidos",
    "commande", "commandes", "atendimento", "enquiries", "informacion",
    "informacoes", "communication", "direction", "obchod", "nabava", "uprava",
    "narocila", "prodaja", "komercijala", "sac", "comex", "webmaster",
    "servicioalcliente", "serviciocliente", "kundenservice", "customerservice",
    "asiakaspalvelu", "kayttotavara", "uvozni", "program", "shop", "webshop",
    "b2b", "market", "horeca", "food", "company", "firma", "logistik",
    "logistics", "finance", "hr", "jobs", "karriere", "vendas", "acquisti",
    "distribution", "distribuzione", "gmbh", "doo", "spa", "srl", "bv", "nv",
])

const PLACEHOLDER = /firstname|lastname|first\.last|yourbrand|example|muster|dummy/i

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g

/** Precisa de dígitos suficientes para ser telefone, não número solto no texto. */
const TELEFONE = /(?:\+|\b00)\d[\d\s\-./()]{6,}|\b\d{2,5}[\s\-/]\d{3,}[\d\s\-/]*/

const ROTULO_DIRETO = /direct line|direct dial|direct phone|durchwahl|linha direta|línea directa/i

const CARGO = String.raw`Managing Director|Gesch(?:ä|ae)ftsf(?:ü|ue)hrer|CEO|Owner|Inhaber|Purchasing Director|Director of Purchasing|Head of Purchasing|Einkaufsleiter|Purchasing|Contact person|Ansprechpartner`

/**
 * Cargo seguido de nome próprio. Exige duas palavras capitalizadas para não
 * confundir "Managing Director" solto com pessoa nomeada.
 */
const PESSOA_NOMEADA = new RegExp(
    String.raw`(?:${CARGO})\s*:?\s+([A-ZÀ-Þ][a-zß-ÿ]+(?:\s+[A-ZÀ-Þ]\.)?\s+[A-ZÀ-Þ][A-Za-zß-ÿ'’-]+)`,
    "g"
)

function dominioBase(email: string): string {
    const dominio = email.split("@")[1]?.toLowerCase() ?? ""
    const partes = dominio.split(".")
    return partes.length >= 2 ? partes[partes.length - 2] : dominio
}

/**
 * Um e-mail é pessoal quando o local part identifica uma pessoa: pelo menos
 * dois blocos alfabéticos separados por ponto ou sublinhado, nenhum deles
 * palavra de função e nenhum deles o próprio nome do domínio.
 *
 * Deliberadamente NÃO tenta adivinhar por iniciais (pb@, kd@): sem contexto
 * elas são indistinguíveis de caixa de setor, e chutar aqui gera o ruído que
 * faz o aviso ser ignorado.
 */
export function emailEhPessoal(email: string): boolean {
    const local = email.split("@")[0]?.toLowerCase() ?? ""
    if (!local || PLACEHOLDER.test(local)) {
        return false
    }

    const blocos = local.replace(/\d+$/, "").split(/[._]/).filter(Boolean)
    if (blocos.length < 2) {
        return false
    }
    if (!blocos.every((bloco) => /^[a-zà-ÿ]{2,}$/.test(bloco))) {
        return false
    }

    const base = dominioBase(email)
    return !blocos.some((bloco) => CAIXAS_FUNCIONAIS.has(bloco) || bloco === base)
}

/** Só é telefone direto se houver telefone: o rótulo sozinho aparece em prosa. */
export function temTelefoneDireto(linha: string): boolean {
    return ROTULO_DIRETO.test(linha) && TELEFONE.test(linha)
}

export function encontrarContatosPessoais(texto: string): Achado[] {
    const achados: Achado[] = []
    const vistos = new Set<string>()

    for (const bruta of texto.split(/\r?\n/)) {
        const linha = bruta.replace(/\s+/g, " ").trim()
        if (!linha) {
            continue
        }

        for (const email of linha.match(EMAIL) ?? []) {
            if (emailEhPessoal(email)) {
                const chave = `email:${email.toLowerCase()}`
                if (!vistos.has(chave)) {
                    vistos.add(chave)
                    achados.push({ tipo: "email_pessoal", valor: email, contexto: linha.slice(0, 200) })
                }
            }
        }

        if (temTelefoneDireto(linha)) {
            const chave = `tel:${linha}`
            if (!vistos.has(chave)) {
                vistos.add(chave)
                achados.push({ tipo: "telefone_direto", valor: linha.slice(0, 80), contexto: linha.slice(0, 200) })
            }
        }

        for (const encontro of linha.matchAll(PESSOA_NOMEADA)) {
            const nome = encontro[1].trim()
            const chave = `nome:${nome.toLowerCase()}`
            if (!vistos.has(chave)) {
                vistos.add(chave)
                achados.push({ tipo: "pessoa_nomeada", valor: nome, contexto: linha.slice(0, 200) })
            }
        }
    }

    return achados
}
