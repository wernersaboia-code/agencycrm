import { describe, expect, it } from "vitest"
import { extrairLeadsDoDiretorio, type ItemPosicionado } from "./leads-do-diretorio"

/** Item de texto na posição (x, y), corpo 9 pt. */
function item(x: number, y: number, texto: string, largura = texto.length * 4): ItemPosicionado {
    return { texto, x, y, altura: 9, largura }
}

describe("extrairLeadsDoDiretorio — formato tabela", () => {
    // Mesmo desenho do diretório do Canadá: cada coluna começa no x do
    // cabeçalho, e o texto de cada célula quebra em várias linhas.
    const pagina = [
        item(57, 720, "8. Directory of Importers and Distributors", 300),
        item(60, 680, "Company / location"), item(150, 680, "Type & focus"), item(260, 680, "Website"), item(360, 680, "General contact"),
        item(60, 660, "Kidcentral Supply"), item(150, 660, "Importer & wholesale"), item(260, 660, "kidcentral.ca"), item(360, 660, "E-mail: info@kidcentral.ca"),
        item(60, 650, "Inc."), item(150, 650, "distributor"), item(360, 650, "Phone: 1-877-218-"),
        item(60, 640, "Toronto, ON"), item(360, 640, "0395 (toll-free)"),
        item(60, 600, "Maighan Distribution"), item(150, 600, "Wholesaler"), item(260, 600, "maighan.com"), item(360, 600, "E-mail: info@maighandistributi"),
        item(360, 590, "on.com"),
        item(57, 500, "9. Recommendations for market entry", 300),
    ]

    const leads = extrairLeadsDoDiretorio([pagina])

    it("acha uma empresa por linha da tabela", () => {
        expect(leads.map((l) => l.companyName)).toEqual(["Kidcentral Supply Inc.", "Maighan Distribution"])
    })

    it("separa nome, local, site, e-mail e telefone pelas colunas", () => {
        expect(leads[0]).toMatchObject({
            location: "Toronto, ON",
            website: "kidcentral.ca",
            emailGeneral: "info@kidcentral.ca",
            phoneGeneral: "1-877-218-0395",
            companyType: "Importer & wholesale distributor",
        })
    })

    it("cola o e-mail que o PDF quebrou em duas linhas", () => {
        expect(leads[1].emailGeneral).toBe("info@maighandistribution.com")
    })
})

describe("extrairLeadsDoDiretorio — formato ficha", () => {
    // Desenho dos estudos de FMCG: nome numa linha, rótulos à esquerda e
    // valores à direita.
    const pagina = [
        item(57, 760, "8. Directory of FMCG importers and distributors", 300),
        item(60, 730, "Company"), item(200, 730, "Channel"), item(330, 730, "Orientation"),
        // Tabela-resumo sem contato: não vira lead.
        item(60, 715, "Wigmore Trading"), item(200, 715, "Full-range importer"), item(330, 715, "Brand-maker"),
        item(60, 680, "Wigmore Trading"),
        item(60, 665, "Profile"), item(200, 665, "Packaged food and beverages importer"),
        item(60, 650, "Address"), item(200, 650, "Lekki, Lagos"),
        item(60, 635, "Website"), item(200, 635, "https://wigmoretrading.com"),
        item(60, 620, "General e-mail"), item(200, 620, "sales@wigmoretrading.com"),
        item(60, 590, "Uniontrade S.r.l."),
        item(60, 575, "Head office / base"), item(200, 575, "Peschiera Borromeo (Milan)"),
        item(60, 560, "Website"), item(200, 560, "www.uniontrade.it"),
        item(60, 545, "Switchboard / phone"), item(200, 545, "+39 02 26922898"),
        item(57, 480, "9. Sources and methodology", 300),
    ]

    const leads = extrairLeadsDoDiretorio([pagina])

    it("lê cada ficha como uma empresa e ignora a tabela-resumo sem contato", () => {
        expect(leads.map((l) => l.companyName)).toEqual(["Wigmore Trading", "Uniontrade S.r.l."])
    })

    it("lê os campos pelos rótulos", () => {
        expect(leads[0]).toMatchObject({
            website: "wigmoretrading.com",
            emailGeneral: "sales@wigmoretrading.com",
            location: "Lekki, Lagos",
        })
        expect(leads[1]).toMatchObject({
            website: "uniontrade.it",
            phoneGeneral: "+39 02 26922898",
            location: "Peschiera Borromeo (Milan)",
        })
    })
})

describe("extrairLeadsDoDiretorio — casos da França e da Finlândia", () => {
    it("célula 'importer; full range' na 2ª coluna não reabre a tabela, e coluna só de nome junta as linhas (França)", () => {
        const pagina = [
            item(57, 760, "8. Directory of importers", 300),
            item(61, 715, "Company"), item(149, 715, "Type"), item(359, 715, "Website / supplier"), item(454, 715, "General e-mail"),
            item(61, 689, "Autour de Bébé / New"), item(149, 689, "Buying group"), item(359, 689, "www.autourdebebe.com"),
            item(61, 678, "Baby (Sagam group)"), item(149, 678, "importer; full"),
            item(149, 668, "range"),
            item(61, 640, "Babilol"), item(149, 640, "Specialised"), item(359, 640, "www.babilol.com"), item(454, 640, "commande@babilol.co"),
            item(149, 630, "wholesaler"), item(454, 630, "m"),
            item(57, 500, "9. Recommendations", 300),
        ]
        const leads = extrairLeadsDoDiretorio([pagina])
        expect(leads.map((l) => l.companyName)).toEqual(["Autour de Bébé / New Baby (Sagam group)", "Babilol"])
        expect(leads[1].emailGeneral).toBe("commande@babilol.com")
    })

    it("linha de dados que começa com 'Importer / distributor' ao lado de 'E-mail:' não é cabeçalho (Finlândia)", () => {
        const pagina = [
            item(57, 760, "7. Directory of importers and distributors", 300),
            item(62, 471, "Company / type"), item(187, 471, "Profile & product categories"), item(372, 471, "Contact for first approach"),
            item(62, 450, "Kiddex Oy"), item(187, 450, "Importer founded in 2008"), item(372, 450, "Website:"), item(412, 450, "www.kiddex.fi"),
            item(62, 435, "Importer / distributor (baby &"), item(187, 435, "focusing on non-toxic products"), item(372, 435, "E-mail:"), item(405, 435, "info@kiddex.fi"),
            item(62, 422, "kids specialist)"), item(372, 422, "Phone:"), item(405, 422, "+358 44 031 2259"),
            item(62, 407, "Helsinki"),
            item(57, 300, "8. Market entry", 300),
        ]
        const [kiddex, ...resto] = extrairLeadsDoDiretorio([pagina])
        expect(resto).toEqual([])
        expect(kiddex).toMatchObject({
            companyName: "Kiddex Oy",
            location: "Helsinki",
            companyType: "Importer / distributor (baby & kids specialist)",
            website: "kiddex.fi",
            emailGeneral: "info@kiddex.fi",
            phoneGeneral: "+358 44 031 2259",
        })
    })
})

describe("extrairLeadsDoDiretorio — sem diretório", () => {
    it("devolve lista vazia quando o estudo não tem capítulo de diretório", () => {
        const pagina = [item(57, 700, "1. Executive Summary", 200), item(57, 680, "Some text about info@x.com")]
        expect(extrairLeadsDoDiretorio([pagina])).toEqual([])
    })
})
