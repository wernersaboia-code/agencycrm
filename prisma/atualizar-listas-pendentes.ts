/**
 * Preenche metaTitle/metaDescription/introduction das listas ativas que ficaram
 * sem conteúdo de busca. Roda com `npm run meta:listas-pendentes`.
 *
 * Por que existe: essas três colunas não têm campo no admin. Foram criadas pela
 * migration 20260903120000_lead_list_meta_seo e são preenchidas por script (a
 * doc de lib/seo/meta-length.ts já apontava para "scripts que escrevem os
 * títulos dos estudos").
 *
 * Por que estas 11: a inspeção por URL (prisma/inspecionar-indexacao.ts)
 * mostrou que são exatamente as canônicas fora do índice por conteúdo fino —
 * `introduction` vazio. As demais listas ativas já têm introdução.
 *
 * REGRA DE VERACIDADE: as introduções descrevem apenas a ESTRUTURA do mercado
 * (canais, concentração, barreiras de acesso) e o que o estudo cobre. Nenhuma
 * cifra de mercado foi inventada — os números que as listas equivalentes trazem
 * vêm do estudo em PDF e precisam ser acrescentados pela operação, não
 * estimados aqui. Por isso os textos são qualitativos de propósito.
 *
 * Idioma: o mesmo critério das listas já publicadas — idioma do país quando é
 * um dos suportados (de, pt, it, en), senão inglês (precedente das listas
 * HoReCa de CZ/DK/NO/PL/SE/IE).
 *
 * Idempotente: escreve sempre os valores definidos abaixo para estes 11 slugs,
 * então rodar de novo aplica revisões. Não toca em nenhuma outra lista.
 */
import { PrismaClient } from "@prisma/client"
import { config } from "dotenv"
import { descricaoCabeNaSerp, tituloCabeNaSerp } from "../lib/seo/meta-length"

config({ path: [".env.local", ".env"] })

const prisma = new PrismaClient()

interface ConteudoLista {
    slug: string
    metaTitle: string
    metaDescription: string
    introduction: string
}

const CONTEUDO: ConteudoLista[] = [
    {
        slug: "fmcg-market-austria",
        metaTitle: "FMCG Österreich: Importeure & Händler",
        metaDescription:
            "Kompakter, kaufkräftiger Markt mit starken Einkaufsgemeinschaften. Kanalstruktur, Zugangsvoraussetzungen und Verzeichnis der Importeure.",
        introduction:
            "Österreich ist ein kleiner, aber kaufkräftiger Markt: rund neun Millionen Einwohner mit hoher Pro-Kopf-Ausgabe und eine Handelslandschaft, in der wenige Ketten und Einkaufsgemeinschaften den überwiegenden Teil des Volumens bündeln. Für einen ausländischen Hersteller bedeutet das weniger Türen, aber jede Listungsentscheidung hat ein entsprechend großes Gewicht. Der Lebensmitteleinzelhandel wird von Vollsortimentern und Diskonten geprägt, während das Cash-&-Carry- und Zustellgroßhandelsgeschäft den Zugang für Gastronomie, Handel und Wiederverkäufer öffnet und damit oft der realistischere Einstieg ist.\n\nDiese Studie betrachtet beide Hälften des Sektors, Food und Non-Food, ordnet Marktvolumen und Kanalstruktur, benennt die führenden Handels- und Großhandelsakteure, erklärt die Zugangsvoraussetzungen für Lieferanten aus der EU, aus dem europäischen Nicht-EU-Raum und von außerhalb Europas und enthält ein Verzeichnis österreichischer FMCG-Importeure und Distributoren.",
    },
    {
        slug: "fmcg-market-brazil",
        metaTitle: "FMCG Brasil: importadores e distribuidores",
        metaDescription:
            "Mercado grande, importação exigente e canais concentrados. Estrutura do varejo, requisitos de acesso e diretório de importadores.",
        introduction:
            "O Brasil é o maior mercado de bens de consumo da América Latina e um dos mais complexos de acessar. A distribuição está concentrada em grandes redes e atacarejos, com força crescente de grupos regionais, enquanto a importação envolve tributação elevada, exigências regulatórias próprias e uma cadeia de importadores e distribuidores especializados por categoria. Para um fornecedor estrangeiro, a escolha do parceiro certo costuma definir se o produto chega ao ponto de venda ou fica preso na barreira de entrada.\n\nEste estudo delimita o perímetro dos bens de consumo, estrutura o mercado de food e non-food, identifica os principais players do varejo e do atacado, detalha os requisitos de acesso conforme a origem do fornecedor e reúne um diretório de importadores e distribuidores brasileiros.",
    },
    {
        slug: "fmcg-market-czech-republic",
        metaTitle: "FMCG Czech Republic: Importers",
        metaDescription:
            "Concentrated retail and a strong cash & carry layer. Market structure, access requirements and a directory of Czech importers.",
        introduction:
            "The Czech consumer goods market is compact but highly organised, and its retail is among the more concentrated in Central Europe: a handful of international chains and discounters account for most grocery volume, while cash & carry and delivered wholesale serve independent retail, HoReCa and resellers. For a foreign supplier the practical question is not volume but route — the market is easy to enter on paper and demanding in its listing and labelling requirements.\n\nThis study sets out the scope of the fast-moving consumer goods sector, measures and structures the market across food and non-food, profiles the leading retail and wholesale players, explains the access requirements for suppliers from the EU, from non-EU Europe and from outside Europe, and provides a directory of Czech FMCG importers and distributors.",
    },
    {
        slug: "fmcg-market-denmark",
        metaTitle: "FMCG Denmark: Importers & Distributors",
        metaDescription:
            "Few chains, high standards and strong private label. Market structure, access requirements and a directory of Danish importers.",
        introduction:
            "Denmark is a small, wealthy market in which a few retail groups and buying organisations control the great majority of grocery volume. High purchasing power sits alongside some of the most demanding requirements in Europe on packaging, labelling and sustainability, and private label occupies a large and growing share of the shelf. For a foreign supplier that already sells abroad, the market rewards a partner who understands the Danish buyer's expectations rather than one who competes on price alone.\n\nThis study covers the fast-moving consumer goods sector across food and non-food, sets out market size and channel structure, profiles the leading retail groups, discounters and wholesale operators, explains the access requirements by supplier origin, and provides a directory of Danish FMCG importers and distributors.",
    },
    {
        slug: "fmcg-market-ireland",
        metaTitle: "FMCG Ireland: Importers & Distributors",
        metaDescription:
            "A compact market where a single national listing travels far. Market structure, access requirements and a directory of Irish importers.",
        introduction:
            "Ireland is a compact market in which a small number of retail groups and wholesale operators reach most of the country, so a single well-chosen listing can carry a product nationwide. That concentration is the market's main attraction for a foreign supplier, and also its main barrier: shelf space is contested, own-brand penetration is high, and the buyer's requirements on provenance, packaging and supply reliability are strict.\n\nThis study sets out the fast-moving consumer goods landscape across food and non-food, measures market size and channel structure, profiles the leading grocery retailers, wholesalers and buying groups, explains the access requirements for suppliers from the EU, from non-EU Europe and from outside Europe, and provides a directory of Irish FMCG importers and distributors.",
    },
    {
        slug: "fmcg-market-italy",
        metaTitle: "FMCG Italia: importatori e distributori",
        metaDescription:
            "Vendita al dettaglio frammentata e grandi centrali d'acquisto. Struttura dei canali, requisiti d'accesso ed elenco degli importatori.",
        introduction:
            "L'Italia è uno dei maggiori mercati di beni di consumo d'Europa, ma anche uno dei più frammentati: accanto ai grandi gruppi nazionali e alle centrali d'acquisto, la distribuzione organizzata convive con una rete capillare di insegne regionali e negozi indipendenti serviti dal cash & carry e dal grossista tradizionale. Per un fornitore estero questo significa che il canale giusto cambia da regione a regione e che la scelta del partner distributivo pesa più del prezzo di listino.\n\nQuesto studio delimita il perimetro dei beni di consumo, analizza il mercato food e non-food, identifica i principali attori della distribuzione moderna e del grosso, illustra i requisiti d'accesso in base alla provenienza del fornitore e raccoglie un elenco di importatori e distributori italiani.",
    },
    {
        slug: "fmcg-market-norway",
        metaTitle: "FMCG Norway: Importers & Distributors",
        metaDescription:
            "Three groups dominate supply, outside the EU. Market structure, access requirements and a directory of Norwegian importers.",
        introduction:
            "Norway is a small population market with high per-capita spending and one of the most concentrated grocery supply chains in Europe: three vertically integrated groups buy for both retail and foodservice, which makes access a matter of a few relationships rather than many. As a non-EU country, Norway also imposes its own import, labelling and border rules, so a supplier's EU documentation alone is not enough.\n\nThis study covers the food and non-food fast-moving consumer goods sector, sets out market size and channel structure, profiles the leading retail groups, discounters and wholesale operators, explains the access requirements for suppliers from the EU, from non-EU Europe and from outside Europe, and provides a directory of Norwegian FMCG importers and distributors.",
    },
    {
        slug: "fmcg-market-poland",
        metaTitle: "FMCG Poland: Importers & Distributors",
        metaDescription:
            "Rapid discount growth and organised wholesale. Market structure, access requirements and a directory of Polish importers.",
        introduction:
            "Poland is one of the largest and fastest-developing consumer markets in the EU, led by discount chains and a rapidly modernising convenience sector, with wholesale operators supplying independent retail and smaller regional chains. For a foreign supplier the market rewards speed and scale: several of the leading players are subsidiaries of large European groups, so European standards and documentation are already familiar on the buying side, but competition on shelf and price is intense.\n\nThis study measures and structures the fast-moving consumer goods market across food and non-food, profiles the leading grocery retailers, discounters and wholesalers, sets out the access requirements by supplier origin, and provides a directory of Polish FMCG importers and distributors.",
    },
    {
        slug: "fmcg-market-sweden",
        metaTitle: "FMCG Sweden: Importers & Distributors",
        metaDescription:
            "Organised retail and a state alcohol monopoly. Market structure, access requirements and a directory of Swedish importers.",
        introduction:
            "Sweden is a high-income market where a small number of organised retail groups dominate grocery, supported by buying alliances and a strong private-label culture. Two features shape the route to market: retail alcohol is sold only through the state monopoly, so beverage suppliers must work through importers and the on-trade separately; and the buyer's expectations on sustainability, packaging and product documentation are among the strictest in Europe.\n\nThis study covers the food and non-food fast-moving consumer goods sector, sets out market size and channel structure, profiles the leading retail groups and wholesalers, explains the access requirements for suppliers from the EU, from non-EU Europe and from outside Europe, and provides a directory of Swedish FMCG importers and distributors.",
    },
    {
        slug: "fmcg-market-switzerland",
        metaTitle: "FMCG Schweiz: Importeure & Händler",
        metaDescription:
            "Kaufkräftig, aber mit eigenen Einfuhrhürden. Kanalstruktur, Zugangsvoraussetzungen und Verzeichnis der Importeure.",
        introduction:
            "Die Schweiz ist ein kleiner, sehr kaufkräftiger Markt außerhalb der EU, in dem zwei große Genossenschaften und der Discounter den Lebensmitteleinzelhandel prägen. Die Kehrseite der Attraktivität sind eigene Hürden: Zoll- und Einfuhrbestimmungen, abweichende Zulassungs- und Deklarationsregeln sowie eine starke Preissensibilität im Grenzhandel. Für einen ausländischen Hersteller ist ein erfahrener Importeur oder Distributor deshalb meist der realistische Weg ins Regal.\n\nDiese Studie betrachtet Food und Non-Food, ordnet Marktvolumen und Kanalstruktur, benennt die führenden Detailhändler und Grossisten, erklärt die Zugangsvoraussetzungen für Lieferanten aus der EU und aus Drittstaaten und enthält ein Verzeichnis schweizerischer FMCG-Importeure und Distributoren.",
    },
    {
        slug: "plant-based-alternatives-germany",
        metaTitle: "Pflanzliche Alternativen: Importeure",
        metaDescription:
            "Europas größter Markt für pflanzliche Alternativen. Kanalstruktur, Zugangsvoraussetzungen und Verzeichnis der Importeure.",
        introduction:
            "Deutschland ist der größte Markt für pflanzliche Alternativen in Europa und einer der reifsten weltweit: Fleisch-, Milch- und Käsealternativen sind längst im Mainstream-Regal angekommen, der Anteil der Eigenmarken steigt und der Preisdruck nimmt zu, während sich das Wachstum von der Nische in den breiten Handel und die Gastronomie verschiebt. Für einen ausländischen Hersteller zählt deshalb weniger der Innovationsvorsprung als die Fähigkeit, Listung, Logistik und Deklaration im deutschen Handel zu erfüllen.\n\nDiese Studie ordnet Marktvolumen und Kanalstruktur für pflanzliche Alternativen, benennt die führenden Handels- und Foodservice-Akteure, beschreibt die Zugangsvoraussetzungen und Kennzeichnungsanforderungen für Lieferanten aus der EU und aus Drittstaaten und enthält ein Verzeichnis deutscher Importeure und Distributoren.",
    },
]

async function main() {
    const dryRun = process.argv.includes("--dry-run")

    for (const item of CONTEUDO) {
        if (!tituloCabeNaSerp(item.metaTitle)) {
            throw new Error(`metaTitle fora do limite de SERP: ${item.slug}`)
        }
        if (!descricaoCabeNaSerp(item.metaDescription)) {
            throw new Error(`metaDescription fora do limite de SERP: ${item.slug}`)
        }
    }

    const existentes = await prisma.leadList.findMany({
        where: { slug: { in: CONTEUDO.map((item) => item.slug) } },
        select: { slug: true },
    })
    const existentesSet = new Set(existentes.map((l) => l.slug))

    const ausentes = CONTEUDO.filter((item) => !existentesSet.has(item.slug))
    if (ausentes.length > 0) {
        throw new Error(`Listas não encontradas: ${ausentes.map((item) => item.slug).join(", ")}`)
    }

    for (const item of CONTEUDO) {
        console.log(
            `${dryRun ? "[dry-run] " : ""}${item.slug}  (title=${item.metaTitle.length}, desc=${item.metaDescription.length}, intro=${item.introduction.length})`
        )
        if (dryRun) continue

        await prisma.leadList.update({
            where: { slug: item.slug },
            data: {
                metaTitle: item.metaTitle,
                metaDescription: item.metaDescription,
                introduction: item.introduction,
            },
        })
    }

    console.log(`\n${dryRun ? "Simuladas" : "Atualizadas"} ${CONTEUDO.length} lista(s).`)
    await prisma.$disconnect()
}

main().catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
})
