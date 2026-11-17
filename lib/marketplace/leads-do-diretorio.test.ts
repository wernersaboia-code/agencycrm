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

describe("extrairLeadsDoDiretorio — fichas da África do Sul", () => {
    // Ficha com código ("A1."), rótulos numa coluna justa (~10 pt até o
    // valor), nome que quebra antes do rótulo, telefone que continua na linha
    // de baixo e rodapé "· Page" entre uma ficha e outra.
    const rotulo = (y: number, texto: string, valor: string) => [item(60, y, texto, texto.length * 4), item(60 + texto.length * 4 + 10, y, valor)]
    const pagina1 = [
        item(57, 790, "9. Directory of importers and distributors", 300),
        item(60, 760, "A1. Brands2Africa (B2A) – Johannesburg (Bryanston)", 260),
        ...rotulo(745, "Company type / channels", "Full turnkey importer-distributor"),
        ...rotulo(730, "Website", "www.brands2africa.com"),
        ...rotulo(715, "General e-mail", "info@brands2africa.com"),
        item(60, 690, "A2. Bounty Foods & Care – Centurion, Cape", 230),
        item(60, 678, "Town, Durban", 60),
        ...rotulo(663, "Company type / channels", "FMCG brand owner"),
        ...rotulo(648, "Website", "bbfc.co.za"),
        ...rotulo(633, "Switchboard / head office", "Durban: +27"),
        item(150, 621, "32 944 1284"),
        ...rotulo(606, "Supplier page / buyer page", "Contact form: bbfc.co.za/contact"),
        item(200, 40, "Market Entry Study FMCG South Africa · Page"),
        item(400, 39, "10"),
    ]
    const pagina2 = [
        item(60, 760, "A3. Rialto Foods – Cape Town (Montague Gardens)", 250),
        ...rotulo(745, "Company type / channels", "Importer and distributor"),
        ...rotulo(730, "Website", "www.rialtofoods.co.za"),
        ...rotulo(715, "Switchboard / head office", "+27 21 555 2160"),
        item(57, 600, "10. Recommendations for market entry", 300),
    ]

    const leads = extrairLeadsDoDiretorio([pagina1, pagina2])

    it("lê uma empresa por ficha, sem confundir telefone ou rodapé com nome", () => {
        expect(leads.map((l) => l.companyName)).toEqual(["Brands2Africa (B2A)", "Bounty Foods & Care", "Rialto Foods"])
    })

    it("tira a cidade do nome e junta o nome que quebrou", () => {
        expect(leads[0]).toMatchObject({ location: "Johannesburg (Bryanston)", website: "brands2africa.com", emailGeneral: "info@brands2africa.com" })
        expect(leads[1]).toMatchObject({ location: "Centurion, Cape Town, Durban", website: "bbfc.co.za" })
        expect(leads[2]).toMatchObject({ website: "rialtofoods.co.za", phoneGeneral: "+27 21 555 2160" })
    })
})

describe("extrairLeadsDoDiretorio — forma jurídica quebrada", () => {
    it("traz o 'KG' da linha do endereço de volta para o nome", () => {
        const pagina = [
            item(57, 760, "8. Directory of importers", 300),
            item(60, 720, "Company / address"), item(220, 720, "Website / contact"),
            item(60, 700, "EDEKA ZENTRALE Stiftung & Co."), item(220, 700, "www.edeka.de"),
            item(60, 690, "KG, New-York-Ring 6, 22297 Hamburg"), item(220, 690, "info@edeka.de"),
            item(57, 600, "9. Recommendations", 300),
        ]
        expect(extrairLeadsDoDiretorio([pagina])[0]).toMatchObject({
            companyName: "EDEKA ZENTRALE Stiftung & Co. KG",
            location: "New-York-Ring 6, 22297 Hamburg",
        })
    })
})

describe("extrairLeadsDoDiretorio — nome à esquerda, rótulos à direita (DIY Reino Unido)", () => {
    // Sem cabeçalho de tabela: nome e perfil em x=77, rótulos com dois-pontos
    // em x=212 e o valor logo depois.
    const empresa = (y: number, nome: string[], perfil: string, site: string, telefone: string) => [
        ...nome.map((n, j) => item(77, y - j * 11, n)),
        item(77, y - nome.length * 11 - 2, perfil),
        item(212, y, "Product groups:", 70), item(285, y, "Tools, garden"),
        item(212, y - 12, "Website:", 37), item(252, y - 12, site),
        item(212, y - 24, "Switchboard:", 57), item(272, y - 24, telefone),
        item(212, y - 36, "Address:", 39), item(254, y - 36, "Trade House, Yeovil"),
        item(212, y - 46, "the commercial buying team."),
    ]
    const pagina = [
        item(57, 790, "7. Directory of importers and distribution partners", 300),
        item(72, 770, "A. DIY and home-improvement retail chains (central buying offices) (8)", 400),
        ...[0, 1, 2, 3, 4].flatMap((n) =>
            empresa(740 - n * 70, n === 0 ? ["Screwfix Direct Ltd", "(Kingfisher plc)"] : [`Empresa ${n} Ltd`], "Generalist for trade – brands", `www.empresa${n}.co.uk`, `+44 1935 41410${n}`)
        ),
        item(57, 300, "8. Recommendations", 300),
    ]

    const leads = extrairLeadsDoDiretorio([pagina])

    it("lê uma empresa por faixa, com nome de duas linhas e perfil separado", () => {
        expect(leads).toHaveLength(5)
        expect(leads[0]).toMatchObject({
            companyName: "Screwfix Direct Ltd (Kingfisher plc)",
            website: "empresa0.co.uk",
            phoneGeneral: "+44 1935 414100",
            location: "Trade House, Yeovil",
            companyType: "Generalist for trade",
        })
    })
})

describe("extrairLeadsDoDiretorio — sem diretório", () => {
    it("devolve lista vazia quando o estudo não tem capítulo de diretório", () => {
        const pagina = [item(57, 700, "1. Executive Summary", 200), item(57, 680, "Some text about info@x.com")]
        expect(extrairLeadsDoDiretorio([pagina])).toEqual([])
    })
})
