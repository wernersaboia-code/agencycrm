export type AboutBlock =
    | { kind: "paragrafo"; texto: string }
    | { kind: "lista"; itens: string[] }
    | { kind: "cartoes"; cartoes: { titulo: string; texto: string }[] }

export type AboutSection = {
    /**
     * Estável entre idiomas. Não é só organização: é por ele que o teste sabe
     * que `cta` faltar no alemão é intencional, e não uma seção perdida.
     */
    id: string
    heading: string
    /** Subtítulo abaixo do título da seção, quando o documento traz um. */
    sub?: string
    blocks: AboutBlock[]
}

/**
 * O texto de "Por que Easy Prospect" é do sócio, um documento por idioma.
 *
 * Ele mora aqui, e não em `messages/*.json`, porque os documentos não são
 * traduções paralelos um do outro: o alemão não tem a chamada final e traz um
 * parágrafo que só existe nele, o português é mais enxuto que o inglês. Chave
 * compartilhada entre idiomas obrigaria a inventar texto para preencher o que
 * falta — exatamente o que não se quer aqui. Mesmo motivo e mesmo formato de
 * `content/legal`.
 */
export type AboutDocument = {
    /** Sobrelinha: o "Por que a EasyProspect?" que abre o documento. */
    eyebrow: string
    title: string
    intro: AboutBlock[]
    sections: AboutSection[]
}
