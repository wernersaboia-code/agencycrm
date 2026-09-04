// lib/marketplace/mercados-catalogo.ts
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { validaCodigoDePais } from "@/lib/i18n/nome-de-pais"
import { INDUSTRY_IDS, type IndustryId } from "@/lib/constants/catalog-facets"
import { CONTINENTES, continenteDoPais, type Continente } from "./continentes"
import { TAG_RESUMO_CATALOGO } from "./resumo-catalogo"

export interface MercadoPais {
    code: string
    /** Quantos estudos ativos cobrem este país. */
    estudos: number
}

export interface MercadoContinente {
    continente: Continente
    paises: number
    estudos: number
    /** Códigos cobertos, do mais presente para o menos. */
    codigos: string[]
}

export interface MercadoSetor {
    id: IndustryId
    /** Quantos estudos ativos são daquele setor. */
    estudos: number
}

export interface MercadosDoCatalogo {
    paises: MercadoPais[]
    continentes: MercadoContinente[]
    totalPaises: number
    /** Quantos dos seis continentes habitados têm pelo menos um estudo. */
    continentesCobertos: number
    /**
     * Setores com pelo menos um estudo publicado, do mais presente ao menos.
     *
     * Vem junto com os países porque é a MESMA linha do banco: `país` e `setor`
     * são as duas dimensões da busca do catálogo (ver `catalog-facets.ts`), e
     * separar em duas funções faria duas consultas idênticas e duas entradas de
     * cache para os mesmos dados.
     */
    setores: MercadoSetor[]
}

/**
 * Os mercados que o catálogo cobre HOJE, lidos do banco.
 *
 * Substitui a lista de regiões linguísticas que vivia em `messages/`. Aquela
 * lista foi escrita no começo do projeto — "países de língua alemã", "países
 * escandinavos" — e nunca acompanhou o catálogo: quando saiu, o catálogo já
 * tinha 62 países em seis continentes, e a home mostrava cinco agrupamentos de
 * idioma. É o mesmo defeito que levou as facetas de país a saírem do vocabulário
 * curado em 03/09; a seção de mercados só demorou mais a ser notada.
 *
 * `continentesCobertos` existe para a página poder AFIRMAR a cobertura sem
 * cravar o número: se um dia o catálogo perder o único estudo da Oceania, a
 * frase encolhe sozinha em vez de virar mentira.
 *
 * Mesma tag de cache do resumo (`TAG_RESUMO_CATALOGO`): as duas leem a mesma
 * tabela e são invalidadas pelo mesmo evento — o admin mexer num estudo. Tag
 * própria só criaria uma segunda coisa para lembrar de invalidar.
 */
export const getMercadosDoCatalogo = unstable_cache(
    async (): Promise<MercadosDoCatalogo> => {
        const estudos = await prisma.leadList.findMany({
            where: { isActive: true },
            select: { countries: true, industries: true },
        })

        const contagem = new Map<string, number>()
        const porSetor = new Map<string, number>()
        for (const estudo of estudos) {
            for (const setor of new Set(estudo.industries)) {
                porSetor.set(setor, (porSetor.get(setor) ?? 0) + 1)
            }

            // `new Set` por estudo: um estudo que liste o mesmo país duas vezes
            // não pode contar duas. O campo é texto livre no admin.
            for (const bruto of new Set(estudo.countries)) {
                const code = bruto.trim().toUpperCase()
                // Mesmo filtro das facetas do catálogo: alias antigo e
                // agrupamento não são país e inflariam a contagem.
                if (!validaCodigoDePais(code).ok) continue
                contagem.set(code, (contagem.get(code) ?? 0) + 1)
            }
        }

        const paises: MercadoPais[] = [...contagem.entries()]
            .map(([code, estudos]) => ({ code, estudos }))
            .sort((a, b) => b.estudos - a.estudos || a.code.localeCompare(b.code))

        const porContinente = new Map<Continente, MercadoContinente>(
            CONTINENTES.map((continente) => [
                continente,
                { continente, paises: 0, estudos: 0, codigos: [] },
            ])
        )

        for (const pais of paises) {
            const continente = continenteDoPais(pais.code)
            // País válido que a tabela de continentes não conhece: o teste de
            // `continentes.ts` impede isso para tudo que está no mapa, e cair
            // fora aqui é melhor que atribuir um continente errado.
            if (!continente) continue

            const agregado = porContinente.get(continente)!
            agregado.paises += 1
            agregado.estudos += pais.estudos
            agregado.codigos.push(pais.code)
        }

        const continentes = [...porContinente.values()]

        // Só o vocabulário curado entra. Setor fora de `INDUSTRY_IDS` não tem
        // rótulo em `messages/` — apareceria como id cru na tela — e o filtro do
        // catálogo também não o conhece, então o card levaria a lugar nenhum.
        // Zero-contagem não é possível aqui por construção: a chave só existe se
        // houver estudo.
        const setores: MercadoSetor[] = INDUSTRY_IDS.filter((id) => porSetor.has(id))
            .map((id) => ({ id, estudos: porSetor.get(id)! }))
            .sort((a, b) => b.estudos - a.estudos || a.id.localeCompare(b.id))

        return {
            paises,
            continentes,
            totalPaises: paises.length,
            continentesCobertos: continentes.filter((c) => c.paises > 0).length,
            setores,
        }
    },
    ["mercados-catalogo"],
    { tags: [TAG_RESUMO_CATALOGO] }
)
