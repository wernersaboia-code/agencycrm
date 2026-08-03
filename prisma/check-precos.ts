/**
 * Integridade dos preços do catálogo. Roda com `npm run check:precos`.
 *
 * Três invariantes que a vitrine não consegue defender sozinha:
 *
 * 1. Toda lista ativa tem preço em EUR. A vitrine cai para euro quando falta
 *    preço na moeda escolhida; se faltar o euro também, não há para onde cair
 *    e a lista aparece sem preço.
 * 2. `LeadList.price` bate com a linha em EUR de `LeadListPrice`. O preço em
 *    euro vive em dois lugares, e este é o alarme de eles terem divergido.
 * 3. Toda lista ativa tem preço em BRL. O Mercado Pago, único provedor ativo,
 *    só cobra em reais — sem essa linha a lista aparece na vitrine mas
 *    ninguém consegue comprá-la.
 *
 * Fica fora do vitest de propósito: nenhum teste deste projeto toca o banco.
 */
import { PrismaClient } from "@prisma/client"
import { config } from "dotenv"

config()

const DEFAULT_CURRENCY = "EUR"
const CHARGE_CURRENCY = "BRL"
const prisma = new PrismaClient()

async function main() {
    const semEuro = await prisma.leadList.findMany({
        where: { isActive: true, prices: { none: { currency: DEFAULT_CURRENCY } } },
        select: { slug: true },
    })

    const semReal = await prisma.leadList.findMany({
        where: { isActive: true, prices: { none: { currency: CHARGE_CURRENCY } } },
        select: { slug: true },
    })

    const lists = await prisma.leadList.findMany({
        where: { isActive: true },
        select: {
            slug: true,
            price: true,
            prices: { where: { currency: DEFAULT_CURRENCY }, select: { amount: true } },
        },
    })

    const divergentes = lists
        .filter((l) => l.prices[0] && Number(l.prices[0].amount) !== Number(l.price))
        .map((l) => l.slug)

    let falhou = false

    if (semEuro.length > 0) {
        falhou = true
        console.error(`✖ ${semEuro.length} lista(s) ativa(s) sem preço em EUR:`)
        for (const l of semEuro) console.error(`   - ${l.slug}`)
        console.error("  Corrija pelo formulário do admin, NUNCA por SQL direto: o caminho")
        console.error("  único de escrita existe justamente para os dois espelhos não divergirem.")
    } else {
        console.log(`✓ ${lists.length} lista(s) ativa(s), todas com preço em EUR`)
    }

    if (divergentes.length > 0) {
        falhou = true
        console.error(`✖ ${divergentes.length} lista(s) com LeadList.price divergindo da linha EUR:`)
        for (const slug of divergentes) console.error(`   - ${slug}`)
    } else {
        console.log("✓ LeadList.price bate com a linha em EUR em todas as listas ativas")
    }

    if (semReal.length > 0) {
        falhou = true
        console.error(`✖ ${semReal.length} lista(s) ativa(s) sem preço em BRL:`)
        for (const l of semReal) console.error(`   - ${l.slug}`)
        console.error("  BRL é a moeda da cobrança: o Mercado Pago só cobra em reais.")
        console.error("  Sem essa linha a lista aparece na vitrine mas não pode ser comprada.")
    } else {
        console.log(`✓ ${lists.length} lista(s) ativa(s), todas com preço em BRL`)
    }

    await prisma.$disconnect()
    process.exit(falhou ? 1 : 0)
}

main().catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
})
