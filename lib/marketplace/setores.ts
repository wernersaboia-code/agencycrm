// lib/marketplace/setores.ts
//
// Setores do catálogo: tipos, nome por idioma e validação do cadastro.
// Sem acesso ao banco — serve ao servidor e aos componentes de cliente. A
// leitura em cache mora em `setores-servidor.ts`.
//
// Critério de curadoria (vale para quem cadastra no admin): um setor por linha
// de estudo, como aparece no título dos estudos de entrada de mercado —
// "Exotic Fruits Market", "HoReCa & Foodservice Market". Sem hierarquia: FMCG
// é FMCG, porque numa lista de país alimentar e não alimentar vêm no mesmo
// arquivo. Setor genérico sem estudo por trás (tech, fashion…) não entra —
// o vocabulário antigo tinha catorze assim e nenhum estudo jamais os usou.

import { z } from "zod"
import { DEFAULT_LOCALE, PUBLISHED_LOCALES } from "@/lib/i18n/locales"

/**
 * Idiomas em que o setor precisa ter nome. São os publicados: o filtro do
 * catálogo aparece em todos eles, e setor sem nome num idioma mostraria o slug
 * cru ("baby_toddler_products") para o visitante.
 */
export const IDIOMAS_DO_SETOR = PUBLISHED_LOCALES

export type NomesDoSetor = Partial<Record<string, string>>

export interface Setor {
    id: string
    labels: NomesDoSetor
    sortOrder: number
}

/** O setor como o visitante o vê: o slug e o nome já no idioma da página. */
export interface SetorRotulado {
    id: string
    nome: string
}

/**
 * Nome do setor no idioma pedido. Idioma roteável sem tradução própria (hoje,
 * `ar`) cai no português, como as mensagens do resto do site; setor que sumiu
 * do cadastro mostra o slug, que é feio mas não esconde o estudo.
 */
export function nomeDoSetor(setor: Pick<Setor, "id" | "labels"> | undefined, id: string, locale: string): string {
    if (!setor) return id
    return setor.labels[locale]?.trim() || setor.labels[DEFAULT_LOCALE]?.trim() || id
}

/** Todos os setores no idioma da página, na ordem do cadastro. */
export function rotularSetores(setores: readonly Setor[], locale: string): SetorRotulado[] {
    return setores.map((setor) => ({ id: setor.id, nome: nomeDoSetor(setor, setor.id, locale) }))
}

/** Mapa slug → nome, para quem só tem os slugs gravados na lista. */
export function mapaDeNomes(setores: readonly Setor[], locale: string): Record<string, string> {
    return Object.fromEntries(rotularSetores(setores, locale).map(({ id, nome }) => [id, nome]))
}

/**
 * Os nomes dos setores de UMA lista, na ordem do cadastro (e não na ordem em
 * que foram marcados), para o mesmo estudo não aparecer com os setores
 * embaralhados entre o card e a página.
 */
export function nomesDosSetoresDaLista(
    idsDaLista: readonly string[],
    setores: readonly Setor[],
    locale: string
): string[] {
    const porId = new Map(setores.map((setor) => [setor.id, setor]))
    const ordem = new Map(setores.map((setor, indice) => [setor.id, indice]))
    return [...idsDaLista]
        .sort((a, b) => (ordem.get(a) ?? Infinity) - (ordem.get(b) ?? Infinity))
        .map((id) => nomeDoSetor(porId.get(id), id, locale))
}

/**
 * O slug vira parte de URL (?industries=horeca) e fica gravado em cada lista,
 * então segue o padrão dos que já existem: minúsculas, dígitos e sublinhado.
 */
export const SLUG_DO_SETOR = /^[a-z][a-z0-9_]{1,59}$/

const nomesSchema = z.object(
    Object.fromEntries(
        IDIOMAS_DO_SETOR.map((idioma) => [idioma, z.string().trim().min(1).max(80)])
    ) as Record<(typeof IDIOMAS_DO_SETOR)[number], z.ZodString>
)

export const setorCriacaoSchema = z.object({
    id: z.string().trim().regex(SLUG_DO_SETOR),
    labels: nomesSchema,
})

export const setorEdicaoSchema = z.object({
    labels: nomesSchema,
})

/**
 * Sugestão de slug a partir do nome em inglês: "Pet Food & Supplies" →
 * "pet_food_supplies". Só sugestão — o admin pode trocar antes de criar, e
 * depois de criado o slug não muda mais.
 */
export function sugerirSlug(nome: string): string {
    return nome
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .replace(/^[^a-z]+/, "")
        .slice(0, 60)
}
