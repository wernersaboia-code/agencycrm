// lib/pdf/templates/purchase-receipt.tsx
//
// O desenho do comprovante de compra. Só desenha: os dados chegam prontos de
// `lib/checkout/comprovante.ts` e os textos já traduzidos e os valores já
// formatados de `lib/checkout/comprovante-pdf.tsx`.
//
// A linha "não é documento fiscal" é parte do documento, não rodapé
// decorativo: é ela que impede o comprovante de ser apresentado como nota
// fiscal a uma contabilidade. Se um dia sair daqui, tem que sair de uma
// decisão, não de uma limpeza de layout.
import React from "react"
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"

// Sem isto o react-pdf hifeniza por conta própria e o nome do vendedor sai
// quebrado como "Werner Carval-ho" no comprovante. Devolver a palavra
// inteira desliga a hifenização: o texto quebra entre palavras, como um
// documento normal.
Font.registerHyphenationCallback((palavra) => [palavra])

export interface TextosComprovante {
    title: string
    numberLabel: string
    dateLabel: string
    sellerLabel: string
    buyerLabel: string
    paymentLabel: string
    itemsLabel: string
    priceLabel: string
    totalLabel: string
    notFiscal: string
}

export interface ComprovanteRenderizavel {
    numero: string
    data: string
    pagamento: string
    vendedor: string[]
    comprador: string[]
    itens: Array<{ nome: string; valor: string }>
    total: string
}

// Mesma paleta dos PDFs editoriais dos estudos (scripts/redesign-market-study.py):
// o comprovante chega junto do estudo e tem que parecer da mesma casa.
const cores = {
    marinho: "#13283A",
    ferrugem: "#D85A32",
    papel: "#FCF9F2",
    trilho: "#F5F0E7",
    tinta: "#243B4C",
    suave: "#63727C",
    linha: "#D9D1C5",
    sobreMarinho: "#DDE6E9",
}

// Os estudos usam Georgia e Segoe UI, que são fontes do Windows e não vão
// para a Vercel. Times e Helvetica são as embutidas do PDF e fazem o mesmo
// par serifa/sem serifa sem carregar arquivo de fonte nenhum.
const SERIFA = "Times-Bold"

const MARGEM = 48
const LARGURA_VALOR = 120

const estilos = StyleSheet.create({
    page: {
        paddingTop: 0,
        paddingBottom: 96,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: cores.tinta,
        backgroundColor: cores.papel,
    },

    cabecalho: {
        backgroundColor: cores.marinho,
        paddingHorizontal: MARGEM,
        paddingTop: 30,
        paddingBottom: 26,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    acento: { position: "absolute", top: 0, left: 0, width: 42, height: 5, backgroundColor: cores.ferrugem },
    marca: { fontFamily: SERIFA, fontSize: 17, color: "#FFFFFF" },
    numeroBloco: { alignItems: "flex-end" },
    numeroRotulo: {
        fontFamily: "Helvetica-Bold",
        fontSize: 7.5,
        letterSpacing: 1,
        color: cores.ferrugem,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    numero: { fontFamily: "Helvetica-Bold", fontSize: 16, color: "#FFFFFF", letterSpacing: 1 },

    corpo: { paddingHorizontal: MARGEM, paddingTop: 34 },
    titulo: { fontFamily: SERIFA, fontSize: 26, color: cores.marinho },
    regua: { marginTop: 10, width: 64, height: 3, backgroundColor: cores.ferrugem },

    resumo: {
        flexDirection: "row",
        marginTop: 26,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: cores.linha,
    },
    resumoCelula: { flex: 1, paddingVertical: 12 },
    resumoCelulaSeguinte: { borderLeftWidth: 1, borderLeftColor: cores.linha, paddingLeft: 16 },
    resumoValor: { fontFamily: "Helvetica-Bold", fontSize: 11, color: cores.marinho },

    partes: { flexDirection: "row", marginTop: 24 },
    parte: { flex: 1, paddingRight: 20 },
    parteNome: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: cores.marinho, marginBottom: 3 },

    rotulo: {
        fontFamily: "Helvetica-Bold",
        fontSize: 7.5,
        letterSpacing: 0.8,
        color: cores.ferrugem,
        textTransform: "uppercase",
        marginBottom: 6,
    },
    linhaDado: { marginBottom: 3, color: cores.tinta },

    tabelaCabecalho: {
        flexDirection: "row",
        marginTop: 34,
        paddingBottom: 7,
        borderBottomWidth: 1.5,
        borderBottomColor: cores.marinho,
    },
    rotuloTabela: {
        fontFamily: "Helvetica-Bold",
        fontSize: 7.5,
        letterSpacing: 0.8,
        color: cores.marinho,
        textTransform: "uppercase",
    },
    item: {
        flexDirection: "row",
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: cores.linha,
    },
    descricao: { flex: 1, paddingRight: 16 },
    valor: { width: LARGURA_VALOR, textAlign: "right" },

    total: {
        flexDirection: "row",
        alignSelf: "flex-end",
        alignItems: "center",
        marginTop: 18,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: cores.marinho,
    },
    totalRotulo: {
        fontFamily: "Helvetica-Bold",
        fontSize: 8,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        color: cores.sobreMarinho,
        marginRight: 24,
    },
    totalValor: { fontFamily: "Helvetica-Bold", fontSize: 15, color: "#FFFFFF" },

    rodape: {
        position: "absolute",
        left: MARGEM,
        right: MARGEM,
        bottom: 36,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: cores.linha,
        flexDirection: "row",
        alignItems: "center",
    },
    aviso: {
        flex: 1,
        paddingLeft: 10,
        borderLeftWidth: 3,
        borderLeftColor: cores.ferrugem,
        color: cores.tinta,
        fontSize: 9,
        lineHeight: 1.45,
    },
    rodapeMarca: { fontFamily: SERIFA, fontSize: 10, color: cores.marinho, marginLeft: 24 },
})

/** Vendedor ou comprador: a primeira linha é sempre o nome, e vem em destaque. */
function Parte({ rotulo, linhas }: { rotulo: string; linhas: string[] }) {
    const [nome, ...resto] = linhas
    return (
        <View style={estilos.parte}>
            <Text style={estilos.rotulo}>{rotulo}</Text>
            {nome && <Text style={estilos.parteNome}>{nome}</Text>}
            {resto.map((linha) => (
                <Text key={linha} style={estilos.linhaDado}>
                    {linha}
                </Text>
            ))}
        </View>
    )
}

export function PurchaseReceiptPDF({
    dados,
    textos,
}: {
    dados: ComprovanteRenderizavel
    textos: TextosComprovante
}) {
    return (
        <Document title={`${textos.title} ${dados.numero}`}>
            <Page size="A4" style={estilos.page}>
                <View style={estilos.cabecalho}>
                    <View style={estilos.acento} />
                    <Text style={estilos.marca}>easy prospect</Text>
                    <View style={estilos.numeroBloco}>
                        <Text style={estilos.numeroRotulo}>{textos.numberLabel}</Text>
                        <Text style={estilos.numero}>{dados.numero}</Text>
                    </View>
                </View>

                <View style={estilos.corpo}>
                    <Text style={estilos.titulo}>{textos.title}</Text>
                    <View style={estilos.regua} />

                    <View style={estilos.resumo}>
                        <View style={estilos.resumoCelula}>
                            <Text style={estilos.rotulo}>{textos.dateLabel}</Text>
                            <Text style={estilos.resumoValor}>{dados.data}</Text>
                        </View>
                        <View style={[estilos.resumoCelula, estilos.resumoCelulaSeguinte]}>
                            <Text style={estilos.rotulo}>{textos.paymentLabel}</Text>
                            <Text style={estilos.resumoValor}>{dados.pagamento}</Text>
                        </View>
                    </View>

                    <View style={estilos.partes}>
                        <Parte rotulo={textos.sellerLabel} linhas={dados.vendedor} />
                        <Parte rotulo={textos.buyerLabel} linhas={dados.comprador} />
                    </View>

                    <View style={estilos.tabelaCabecalho}>
                        <Text style={[estilos.descricao, estilos.rotuloTabela]}>{textos.itemsLabel}</Text>
                        <Text style={[estilos.valor, estilos.rotuloTabela]}>{textos.priceLabel}</Text>
                    </View>

                    {dados.itens.map((item) => (
                        <View key={item.nome} style={estilos.item} wrap={false}>
                            <Text style={estilos.descricao}>{item.nome}</Text>
                            <Text style={estilos.valor}>{item.valor}</Text>
                        </View>
                    ))}

                    <View style={estilos.total} wrap={false}>
                        <Text style={estilos.totalRotulo}>{textos.totalLabel}</Text>
                        <Text style={estilos.totalValor}>{dados.total}</Text>
                    </View>
                </View>

                {/* `fixed`: com muitos itens o comprovante vira duas páginas, e
                    o aviso fiscal tem que estar em todas. */}
                <View style={estilos.rodape} fixed>
                    <Text style={estilos.aviso}>{textos.notFiscal}</Text>
                    <Text style={estilos.rodapeMarca}>easy prospect</Text>
                </View>
            </Page>
        </Document>
    )
}
