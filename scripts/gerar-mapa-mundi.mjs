// scripts/gerar-mapa-mundi.mjs
//
// Gera `components/landing/dados-mapa-mundi.ts` a partir do world-atlas.
//
// Por que gerar em vez de projetar em runtime: as fronteiras do mundo não mudam
// entre um deploy e outro, e a home é a página mais visitada do site. Projetar a
// cada render gastaria CPU do servidor para produzir sempre o mesmo `d`, e fazer
// isso no cliente colocaria d3-geo e topojson no bundle da landing. Com o
// arquivo gerado, `world-atlas`, `topojson-client`, `d3-geo` e
// `i18n-iso-countries` ficam em devDependencies e NUNCA entram no build.
//
// Duas resoluções, de propósito:
//
// - As FORMAS vêm do 110m, o mais grosseiro do world-atlas. É perfeitamente
//   legível no tamanho em que o mapa aparece, e a 50m o arquivo gerado passa de
//   1 MB — embutido no HTML da home, o detalhe extra custaria mais que entrega.
// - Os PONTOS vêm do 50m, que conhece 235 países contra 174. O 110m simplesmente
//   não tem Maurício, Malta nem Singapura, e os três estão no catálogo hoje: sem
//   isso o mapa apagaria em silêncio países que temos. O 50m é lido só para
//   pegar o centro de cada país e depois descartado — nada dele vai para o
//   arquivo gerado além de dois números por país.
//
// Rodar com:  node scripts/gerar-mapa-mundi.mjs

import { writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { geoEqualEarth, geoPath } from "d3-geo"
import { feature } from "topojson-client"
import countries from "i18n-iso-countries"

const require = createRequire(import.meta.url)

const LARGURA = 1000
const ANTARTIDA = "010"

// Equal Earth: projeção de área equivalente. Numa seção cuja afirmação é
// "temos estudos em todos os continentes", usar Mercator seria inflar a Europa
// e encolher a África e a Indonésia — justamente as áreas que a seção conta.
const projecao = geoEqualEarth()

function carrega(resolucao) {
    const topo = require(`world-atlas/countries-${resolucao}.json`)
    const geo = feature(topo, topo.objects.countries)
    // Antártida sai: não tem importador, e na Equal Earth ela ocupa uma faixa
    // larga no rodapé que empurraria todo o resto para cima.
    geo.features = geo.features.filter((f) => String(f.id) !== ANTARTIDA)
    return geo
}

const formas = carrega("110m")
const detalhado = carrega("50m")

// A projeção é ajustada UMA vez, pelas formas que serão desenhadas, e depois
// reusada para os pontos. Ajustar de novo para o 50m moveria os marcadores em
// relação ao mapa.
projecao.fitWidth(LARGURA, formas)
const caminho = geoPath(projecao)

const [[, y0], [, y1]] = caminho.bounds(formas)
const ALTURA = Math.ceil(y1 - y0)
projecao.translate([projecao.translate()[0], projecao.translate()[1] - y0])

const alpha2 = (f) => countries.numericToAlpha2(String(f.id).padStart(3, "0")) || null
const arredonda1 = (n) => Math.round(n * 10) / 10
const encolhe = (d) => d.replace(/-?\d+\.\d+/g, (n) => String(arredonda1(Number(n))))

const porCodigo = new Map()

// 1) Centro de cada país, do dataset detalhado.
for (const f of detalhado.features) {
    const code = alpha2(f)
    if (!code) continue
    const [cx, cy] = caminho.centroid(f)
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) continue
    porCodigo.set(code, { code, d: "", area: 0, cx: arredonda1(cx), cy: arredonda1(cy) })
}

// 2) Forma e área de quem existe no dataset grosseiro.
const semAlpha2 = []
for (const f of formas.features) {
    const code = alpha2(f)
    if (!code) {
        semAlpha2.push(f.properties?.name ?? String(f.id))
        continue
    }
    const d = caminho(f)
    if (!d) continue

    const atual = porCodigo.get(code) ?? { code, cx: 0, cy: 0 }
    const [cx, cy] = caminho.centroid(f)
    porCodigo.set(code, {
        code,
        d: encolhe(d),
        // Área projetada em px². É ela que decide se o país precisa de um
        // marcador para ser visto: pintado de azul, um país de 3 px² é
        // indistinguível do mar.
        area: Math.round(caminho.area(f)),
        cx: atual.cx || arredonda1(cx),
        cy: atual.cy || arredonda1(cy),
    })
}

const paises = [...porCodigo.values()].sort((a, b) => a.code.localeCompare(b.code))
const comForma = paises.filter((p) => p.d).length

const conteudo = `// GERADO POR scripts/gerar-mapa-mundi.mjs — NÃO EDITAR À MÃO.
//
// Fronteiras do mundo já projetadas (Equal Earth), a partir do world-atlas
// (domínio público, derivado do Natural Earth). Formas na resolução 110m,
// centros na 50m — ver o cabeçalho do script.
//
// Regerar com: node scripts/gerar-mapa-mundi.mjs

export interface PaisDoMapa {
    /** ISO 3166-1 alpha-2, a mesma chave que o catálogo usa. */
    code: string
    /** Atributo \`d\` do <path>, já projetado. Vazio para país sem forma a 110m. */
    d: string
    /** Área projetada em px². Abaixo de \`AREA_MINIMA\` o país some quando pintado. */
    area: number
    /** Centro projetado, para o marcador de país pequeno ou sem forma. */
    cx: number
    cy: number
}

export const MAPA_VIEWBOX = "0 0 ${LARGURA} ${ALTURA}"

/**
 * Abaixo desta área projetada, pintar o país não o torna visível: Luxemburgo
 * tem 2 px² e Catar 10 px² neste viewBox. Esses ganham um marcador circular por
 * cima da forma, e é o marcador que os torna clicáveis.
 */
export const AREA_MINIMA = 40

export const PAISES_DO_MAPA: PaisDoMapa[] = ${JSON.stringify(paises)}
`

writeFileSync("components/landing/dados-mapa-mundi.ts", conteudo)

console.log(`gerado: ${paises.length} países (${comForma} com forma), viewBox 0 0 ${LARGURA} ${ALTURA}`)
console.log(`tamanho: ${(conteudo.length / 1024).toFixed(0)} KB`)
if (semAlpha2.length) console.log("sem alpha-2 (ignorados):", semAlpha2.join(", "))
