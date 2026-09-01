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

const cores = {
    texto: "#1F2937",
    suave: "#6B7280",
    linha: "#E5E7EB",
    marca: "#2EC4B6",
}

const estilos = StyleSheet.create({
    page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: cores.texto },
    titulo: { fontSize: 18, fontFamily: "Helvetica-Bold" },
    numero: { marginTop: 4, color: cores.suave },
    faixa: { marginTop: 18, height: 2, backgroundColor: cores.marca },
    partes: { flexDirection: "row", gap: 24, marginTop: 24 },
    parte: { flex: 1 },
    rotulo: { fontSize: 8, color: cores.suave, textTransform: "uppercase", marginBottom: 4 },
    linhaDado: { marginBottom: 3, lineHeight: 1.2 },
    tabelaCabecalho: {
        flexDirection: "row",
        marginTop: 28,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: cores.linha,
    },
    item: {
        flexDirection: "row",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: cores.linha,
    },
    descricao: { flex: 1, paddingRight: 12 },
    valor: { width: 110, textAlign: "right" },
    total: { flexDirection: "row", marginTop: 12 },
    totalRotulo: { flex: 1, textAlign: "right", paddingRight: 12, fontFamily: "Helvetica-Bold" },
    totalValor: { width: 110, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 12 },
    aviso: {
        marginTop: 36,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: cores.linha,
        color: cores.suave,
        fontSize: 9,
        lineHeight: 1.5,
    },
})

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
                <Text style={estilos.titulo}>{textos.title}</Text>
                <Text style={estilos.numero}>
                    {textos.numberLabel} {dados.numero}
                </Text>
                <View style={estilos.faixa} />

                <View style={estilos.partes}>
                    <View style={estilos.parte}>
                        <Text style={estilos.rotulo}>{textos.sellerLabel}</Text>
                        {dados.vendedor.map((linha) => (
                            <Text key={linha} style={estilos.linhaDado}>
                                {linha}
                            </Text>
                        ))}
                    </View>
                    <View style={estilos.parte}>
                        <Text style={estilos.rotulo}>{textos.buyerLabel}</Text>
                        {dados.comprador.map((linha) => (
                            <Text key={linha} style={estilos.linhaDado}>
                                {linha}
                            </Text>
                        ))}
                    </View>
                    <View style={estilos.parte}>
                        <Text style={estilos.rotulo}>{textos.dateLabel}</Text>
                        <Text style={estilos.linhaDado}>{dados.data}</Text>
                        <Text style={[estilos.rotulo, { marginTop: 10 }]}>{textos.paymentLabel}</Text>
                        <Text style={estilos.linhaDado}>{dados.pagamento}</Text>
                    </View>
                </View>

                <View style={estilos.tabelaCabecalho}>
                    <Text style={[estilos.descricao, estilos.rotulo]}>{textos.itemsLabel}</Text>
                    <Text style={[estilos.valor, estilos.rotulo]}>{textos.priceLabel}</Text>
                </View>

                {dados.itens.map((item) => (
                    <View key={item.nome} style={estilos.item}>
                        <Text style={estilos.descricao}>{item.nome}</Text>
                        <Text style={estilos.valor}>{item.valor}</Text>
                    </View>
                ))}

                <View style={estilos.total}>
                    <Text style={estilos.totalRotulo}>{textos.totalLabel}</Text>
                    <Text style={estilos.totalValor}>{dados.total}</Text>
                </View>

                <Text style={estilos.aviso}>{textos.notFiscal}</Text>
            </Page>
        </Document>
    )
}
