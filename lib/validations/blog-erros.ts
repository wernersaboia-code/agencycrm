// lib/validations/blog-erros.ts
//
// Traduz ZodIssue[] (de createPostSchema/categoryInputSchema) em erros que a UI
// consegue mostrar por campo/idioma. Existe porque .parse() joga a mensagem
// fora: em produção o Next.js redige o erro de Server Action e o usuário via
// só "ocorreu um erro" sem saber que era o resumo passando de 500 caracteres.
//
// Propositalmente sem texto humano aqui: cada issue vira um { campo, locale,
// codigo, limite } e é a UI (post-editor.tsx) que formata a frase, com
// useTranslations("admin.blogEditor"). Assim a mensagem já nasce nos seis
// idiomas que o namespace "admin" cobre (pt/en, com fallback pt nos demais),
// em vez de duplicar strings em português dentro de lib/validations.
import type { ZodIssue } from "zod"

export type ErroDeCampo = {
    /** Nome do campo dentro da tradução (title, slug, excerpt, ...) ou "root" quando o issue não aponta para um campo de tradução. */
    campo: string
    /** Locale da tradução afetada (translations[N].locale), quando aplicável. */
    locale?: string
    /** Código bruto do ZodIssue (too_big, too_small, invalid_format, ...). */
    codigo: string
    /** Limite máximo/mínimo envolvido, quando o issue for too_big/too_small. */
    limite?: number
}

function limiteDoIssue(issue: ZodIssue): number | undefined {
    // too_big/too_small carregam "maximum"/"minimum" — os únicos casos com
    // limite acionável para o usuário (os demais códigos não têm um número).
    if (issue.code === "too_big" && typeof issue.maximum === "number") return issue.maximum
    if (issue.code === "too_small" && typeof issue.minimum === "number") return issue.minimum
    return undefined
}

/**
 * Resolve issues do Zod em erros de campo legíveis.
 *
 * `locales` é a lista de locales na MESMA ordem do array `translations`
 * enviado ao schema (ex.: ["pt", "en"]), porque o ZodIssue só carrega o
 * índice numérico do array (path: ["translations", 0, "excerpt"]) — sem essa
 * lista não dá para saber que o índice 0 era "pt".
 */
export function traduzirErrosDoPost(issues: ZodIssue[], locales: string[]): ErroDeCampo[] {
    return issues.map((issue) => {
        const [primeiro, segundo, terceiro] = issue.path
        if (primeiro === "translations" && typeof segundo === "number") {
            return {
                campo: terceiro !== undefined ? String(terceiro) : "root",
                locale: locales[segundo],
                codigo: issue.code,
                limite: limiteDoIssue(issue),
            }
        }
        return {
            campo: primeiro !== undefined ? String(primeiro) : "root",
            codigo: issue.code,
            limite: limiteDoIssue(issue),
        }
    })
}
