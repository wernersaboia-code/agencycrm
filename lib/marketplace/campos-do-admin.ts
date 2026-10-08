// lib/marketplace/campos-do-admin.ts

/**
 * Colunas de `LeadList` que só o admin pode ver. Toda consulta que alimenta
 * página pública passa isto em `omit`.
 *
 * Não basta não exibir: o catálogo e a vitrine da home entregam a lista INTEIRA
 * a componentes de cliente (`...list`), e tudo que entra nessa entrega fica
 * legível no código-fonte da página. O número de empresas do diretório é
 * referência interna de preço — estudo de país pequeno com poucas empresas
 * pareceria fraco ao lado de um grande, mesmo cobrindo o mercado inteiro.
 */
export const CAMPOS_SO_DO_ADMIN = {
    companyCount: true,
    companyCountManual: true,
} as const
