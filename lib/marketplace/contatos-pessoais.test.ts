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
