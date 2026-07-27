// lib/i18n/merge-messages.ts

/**
 * Preenche as chaves que faltam em um arquivo de mensagens com o texto do
 * idioma-fonte.
 *
 * Sem isso, uma chave ausente vira o próprio caminho na tela ("admin.common.save"),
 * que é o pior desfecho possível: não é texto, não é erro e passa pelo build.
 * Com o merge, o pior caso vira "aparece em português" — feio, mas legível e
 * óbvio para quem vê.
 *
 * O merge é recursivo e não destrutivo: valor traduzido sempre vence o do
 * fallback, e só descemos na árvore quando os dois lados são objeto.
 */
export type Messages = { [key: string]: string | Messages }

function isMessages(value: unknown): value is Messages {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function mergeMessages(fallback: Messages, messages: Messages): Messages {
    const merged: Messages = { ...fallback }

    for (const [key, value] of Object.entries(messages)) {
        const base = merged[key]

        merged[key] = isMessages(value) && isMessages(base)
            ? mergeMessages(base, value)
            : value
    }

    return merged
}
