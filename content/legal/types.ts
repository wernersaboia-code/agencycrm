export type LegalKind = "privacy" | "terms"

export type LegalBlock =
    | { kind: "paragrafo"; texto: string }
    | { kind: "lista"; itens: string[] }

export type LegalSection = {
    /** Estável entre idiomas: é a chave que o teste de paridade compara. */
    id: string
    heading: string
    blocks: LegalBlock[]
}

export type LegalDocument = {
    title: string
    /**
     * Data literal em ISO, editada à mão quando o texto muda.
     *
     * Antes disto a página renderizava `new Date()`, ou seja, afirmava ter sido
     * atualizada hoje — todo dia. Numa política de privacidade isso impede
     * saber qual versão o usuário viu.
     */
    lastUpdated: string
    sections: LegalSection[]
}
