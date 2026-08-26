import { describe, it, expect } from "vitest"
import {
    emailEhPessoal,
    temTelefoneDireto,
    encontrarContatosPessoais,
} from "./contatos-pessoais"

/**
 * Os casos abaixo são linhas REAIS dos 51 estudos do catálogo, colhidas na
 * varredura que motivou esta validação. Os "não deve acusar" são exatamente os
 * falsos positivos da primeira versão do detector — se voltarem, o admin passa
 * a ignorar o aviso, e um aviso ignorado não protege ninguém.
 */
describe("emailEhPessoal", () => {
    const pessoais = [
        "viktor.walz@importhaus-wilms.de",
        "katrin.weissensteiner@kastner.at",
        "hubackova.martina@cba.cz",
        "michel.lesage@suedfisch.net",
        "cristobal.valenzuela@jaguartfc.nl",
        "ave.roomets@hellin.eu",
        "helge_tamm@trofi.de",
        "manon.baud@relais-vert.com",
        "julien.cussinet@ekibio.fr",
        // inicial.sobrenome: no catálogo inteiro, os quatro nesta forma são pessoas
        "t.vana@fany.cz",
        "m.suer@arasco.de",
        "u.susol@bdgroup.eu",
    ]
    for (const email of pessoais) {
        it(`acusa ${email}`, () => {
            expect(emailEhPessoal(email)).toBe(true)
        })
    }

    const funcionais = [
        "info@calgros.de",
        "famobrapurchasers@famobra.com",
        "servizio.clienti@metro.it",
        "asiakaspalvelu.metro@wihuri.fi",
        "kayttotavara.meiranova@meiranova.fi",
        "hellin.ee@hellin.eu",
        "calvet.distribution@orange.fr",
        "firstname.lastname@company.com",
        "order.ee@hellin.eu",
        // siglas curtas: 7 das 8 no catálogo são função ou iniciais da firma
        // falsos positivos dos estudos novos (UK, África do Sul, Indonésia)
        "customer.services@mvsports.com",
        "myorders.pta@vassco.co.za",
        "myorders.jhb@vassco.co.za",
        "bev.div@lotusfood.online",
        "sac@rioquality.com.br",
        "ba@borgandaquilina.com.mt",
        "mwp@musgrave.ie",
        "ltt@ltt.ee",
    ]
    for (const email of funcionais) {
        it(`não acusa ${email}`, () => {
            expect(emailEhPessoal(email)).toBe(false)
        })
    }
})

describe("temTelefoneDireto", () => {
    it("acusa rótulo acompanhado de telefone", () => {
        expect(
            temTelefoneDireto(
                "Purchasing: Viktor Walz — viktor.walz@importhaus-wilms.de, direct line +49 6123 9990-131"
            )
        ).toBe(true)
    })

    it("não acusa 'direct line' usado em prosa", () => {
        expect(
            temTelefoneDireto(
                "treat it as a qualified starting point rather than a guaranteed direct line:"
            )
        ).toBe(false)
    })

    it("não acusa recomendação com 'more direct line'", () => {
        expect(
            temTelefoneDireto(
                "In the medium term, with growing volume and a track record, seek the more direct line"
            )
        ).toBe(false)
    })
})

describe("encontrarContatosPessoais", () => {
    it("acha nome, e-mail e telefone na entrada do Importhaus Wilms", () => {
        const achados = encontrarContatosPessoais(
            "Decision contacts Purchasing: Viktor Walz — viktor.walz@importhaus-wilms.de, direct line +49 6123 9990-131"
        )
        expect(achados.map((a) => a.tipo).sort()).toEqual([
            "email_pessoal",
            "pessoa_nomeada",
            "telefone_direto",
        ])
        expect(achados.find((a) => a.tipo === "pessoa_nomeada")?.valor).toBe("Viktor Walz")
    })

    it("acusa pessoa nomeada mesmo sem contato pessoal", () => {
        const achados = encontrarContatosPessoais("Decision contacts Managing Director: Wladimir Eichmann")
        expect(achados).toHaveLength(1)
        expect(achados[0]).toMatchObject({ tipo: "pessoa_nomeada", valor: "Wladimir Eichmann" })
    })

    it("não acusa entrada que usa caixa funcional", () => {
        const achados = encontrarContatosPessoais(
            "Decision contacts Central purchasing mailbox for supplier offers: famobrapurchasers@famobra.com"
        )
        expect(achados).toEqual([])
    })

    /**
     * Estas linhas passaram batido na primeira versão e só apareceram quando o
     * PDF editado foi reconferido: julgado isolado, `u.susol@` é inicial mais
     * sobrenome e `kd@` é sigla — nenhum dos dois distinguível de caixa de
     * setor. Na linha, o nome está ao lado e não há dúvida.
     */
    it.each([
        ["Decision contacts Urszula Susoł, Director of Purchasing Department — u.susol@bdgroup.eu, +48 608 309 549", "u.susol@bdgroup.eu"],
        ["Decision contacts Kasper G. Drachmann, Purchasing Director — kd@geiafood.se, +45 96 34 15 85", "kd@geiafood.se"],
        ["Decision contacts Peter Bräuner, CEO — pb@brauner-fmcg.com", "pb@brauner-fmcg.com"],
        ["Kristian W. Iversen, COO — kwi@brauner-fmcg.com", "kwi@brauner-fmcg.com"],
        ["Decision contacts Zbigniew Wodziński, Import/Export — z.wodzinski@compassfmcg.com, +48 512 829 842", "z.wodzinski@compassfmcg.com"],
    ])("acusa e-mail na linha que nomeia a pessoa: %s", (linha, endereco) => {
        const achados = encontrarContatosPessoais(linha)
        expect(achados.some((a) => a.tipo === "email_pessoal" && a.valor === endereco)).toBe(true)
    })

    /**
     * O estudo da Estônia lista os contatos com travessão no lugar da vírgula
     * ("Katriin Kull — Purchasing Manager"). Com a atribuição exigindo vírgula,
     * quatro caixas nominais de primeiro nome escapavam inteiras: local part de
     * um bloco só nunca é julgado pessoal fora de contexto, e sem a atribuição
     * não havia contexto nenhum.
     */
    it.each([
        ["• Katriin Kull — Purchasing Manager (ostujuht): katriin@horecaservice.ee", "katriin@horecaservice.ee"],
        ["• Arbo-Karl Bramanis — Sales Director: arbo@horecaservice.ee", "arbo@horecaservice.ee"],
        ["• Raul Vaet — Board member: raul@horecaservice.ee", "raul@horecaservice.ee"],
        ["• Reimo Leol — Board member: reimo@horecaservice.ee", "reimo@horecaservice.ee"],
    ])("acusa caixa de primeiro nome quando o travessão separa nome e cargo: %s", (linha, endereco) => {
        const achados = encontrarContatosPessoais(linha)
        expect(achados.some((a) => a.tipo === "email_pessoal" && a.valor === endereco)).toBe(true)
    })

    it("não toma instituição por pessoa nem número de regulamento por telefone", () => {
        expect(
            encontrarContatosPessoais(
                "• European Commission — Import controls of food and feed; Reg. (EU) 2017/625 (food.ec.europa.eu)"
            )
        ).toEqual([])
    })

    it("não toma nome de empresa por pessoa por causa do travessão", () => {
        expect(
            encontrarContatosPessoais("Horeca Service OÜ — Dedicated HoReCa / foodservice wholesaler")
        ).toEqual([])
    })

    it("acusa o telefone da pessoa mesmo sem a etiqueta 'direct line'", () => {
        const achados = encontrarContatosPessoais(
            "Decision contacts Zbigniew Wodziński, Import/Export — z.wodzinski@compassfmcg.com, +48 512 829 842"
        )
        expect(achados.some((a) => a.tipo === "telefone_direto")).toBe(true)
    })

    it("não confunde caixa da empresa com pessoa por causa do sobrenome no domínio", () => {
        expect(encontrarContatosPessoais("Contact dangaard@dangaard.com")).toEqual([])
    })

    it("não acusa telefone geral numa linha sem pessoa", () => {
        expect(
            encontrarContatosPessoais("Contact info@calgros.de Tel. +49 461 999 89 00")
        ).toEqual([])
    })

    it("não acusa página de análise sem diretório", () => {
        const achados = encontrarContatosPessoais(
            "Discounters hold a share of grocery turnover that has no equivalent in most of Europe, " +
                "and they buy centrally, in enormous volumes, predominantly under their own labels."
        )
        expect(achados).toEqual([])
    })

    it("não repete o mesmo e-mail que aparece em páginas diferentes", () => {
        const achados = encontrarContatosPessoais(
            "p14 michael.floeckner@eurogast.at\np17 michael.floeckner@eurogast.at"
        )
        expect(achados).toHaveLength(1)
    })

    it("devolve o contexto para o admin julgar sem abrir o PDF", () => {
        const achados = encontrarContatosPessoais("E-mail: ivan.vykouk@refi-cz.cz")
        expect(achados[0].contexto).toBe("E-mail: ivan.vykouk@refi-cz.cz")
    })
})
