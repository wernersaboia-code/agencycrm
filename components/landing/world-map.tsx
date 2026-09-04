import { getPathname } from "@/lib/i18n/navigation"
import { AREA_MINIMA, MAPA_VIEWBOX, PAISES_DO_MAPA } from "./dados-mapa-mundi"
import type { LandingLocale } from "./types"

export interface PaisCoberto {
    code: string
    nome: string
    estudos: number
}

/**
 * O mapa-múndi da seção de mercados, com os países do catálogo destacados.
 *
 * Renderizado no SERVIDOR, em SVG puro, e sem NADA de JavaScript: as formas já
 * vêm projetadas de `dados-mapa-mundi.ts`, gerado em build por
 * `scripts/gerar-mapa-mundi.mjs`. `d3-geo`, `topojson-client` e `world-atlas`
 * são devDependencies e não entram no bundle. Na home, que é a página mais
 * visitada e já tem uma frente de performance aberta, um mapa interativo de
 * cliente custaria mais do que entrega.
 *
 * Os 62 links de país são âncoras cruas com o caminho montado por
 * `getPathname()`, e não o `Link` ciente de locale. O `Link` é um componente de
 * cliente: usá-lo aqui hidrataria 62 âncoras dentro do SVG e devolveria pelo
 * cliente exatamente o custo que gerar o mapa em build economizou. O que se
 * perde é a navegação sem recarga ao ir para o catálogo — de uma landing, uma
 * navegação de página inteira é o comportamento normal.
 *
 * A interação também dispensa JS:
 *
 * - país coberto vira um `<a>` para o catálogo já filtrado;
 * - nome e número de estudos vão no `<title>`, que é o tooltip nativo do SVG;
 * - o realce de hover e foco é CSS (`.mapa-*` em `globals.css`).
 *
 * País pequeno demais para ser visto pintado (Luxemburgo tem 2 px² neste
 * viewBox, Catar 10) ganha um marcador circular por cima, e Maurício, Malta e
 * Singapura — que nem existem na resolução das formas — aparecem SÓ como
 * marcador. Sem isso o mapa apagaria em silêncio três países que temos.
 */
export function WorldMap({
    cobertos,
    locale,
}: {
    cobertos: PaisCoberto[]
    locale: LandingLocale
}) {
    const porCodigo = new Map(cobertos.map((p) => [p.code, p]))

    const semCobertura = PAISES_DO_MAPA.filter((p) => p.d && !porCodigo.has(p.code))
    const comCobertura = PAISES_DO_MAPA.filter((p) => porCodigo.has(p.code))

    const catalogo = getPathname({ href: "/catalog", locale })

    return (
        <svg
            viewBox={MAPA_VIEWBOX}
            className="h-auto w-full"
            role="img"
            aria-label={cobertos.map((p) => p.nome).join(", ")}
        >
            {/* O resto do mundo, numa camada só e sem interação. */}
            <g className="mapa-terra">
                {semCobertura.map((pais) => (
                    <path key={pais.code} d={pais.d} />
                ))}
            </g>

            <g className="mapa-coberto">
                {comCobertura.map((pais) => {
                    const dados = porCodigo.get(pais.code)!

                    return (
                        <a
                            key={pais.code}
                            href={`${catalogo}?countries=${pais.code}`}
                            className="mapa-pais"
                        >
                            <title>{`${dados.nome} — ${dados.estudos}`}</title>
                            {pais.d && <path d={pais.d} />}
                            {pais.area < AREA_MINIMA && (
                                <circle cx={pais.cx} cy={pais.cy} r="5" className="mapa-marcador" />
                            )}
                        </a>
                    )
                })}
            </g>
        </svg>
    )
}
