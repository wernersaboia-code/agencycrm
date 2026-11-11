import { FadeInView } from "@/components/motion"
import { cn } from "@/lib/utils"

type SectionTone = "default" | "muted" | "glow" | "pause"
type SectionWidth = "narrow" | "wide"

/**
 * Casca padrão das seções da landing: espaçamento, divisor e largura do
 * container num lugar só. Antes cada seção repetia essas classes e elas já
 * tinham divergido — `py-14`, `py-14 md:py-16` e `py-14 md:py-18` conviviam, e
 * o `border-t` aparecia em 4 de 10 seções.
 *
 * O `tone` alterna o fundo em pares para a página não virar um bloco contínuo
 * de uma cor só. A escolha mora em cada seção, e não numa prop vinda da página,
 * porque a landing é renderizada por rota de locale: com prop, cada idioma
 * poderia acabar com um ritmo visual diferente.
 */
export function Section({
    id,
    tone = "default",
    width = "wide",
    className,
    children,
}: {
    id?: string
    tone?: SectionTone
    width?: SectionWidth
    className?: string
    children: React.ReactNode
}) {
    return (
        <section
            id={id}
            className={cn(
                // scroll-mt: o cabeçalho é sticky (64px) e cobria o topo da
                // seção ao chegar por âncora (#como-funciona, #estudo-gratuito).
                // Sem divisor e sem faixa de corte seco: o fundo "muted" entra e
                // sai em degradê, e a página lê como uma superfície contínua.
                "scroll-mt-16 py-14 md:py-16",
                tone === "muted" && "bg-linear-to-b from-transparent via-muted/50 to-transparent",
                // Respiro entre blocos de cartões: um brilho do azul da marca
                // que nasce no centro e some nas bordas, sem faixa.
                // `glow` é o mesmo brilho com o espaçamento normal: na home ele
                // está em todas as seções, e o centro de cada uma vira o ponto
                // de luz — a página respira sem faixas.
                (tone === "glow" || tone === "pause") && "section-pause",
                tone === "pause" && "py-20 md:py-24",
                className
            )}
        >
            {/* A entrada que antes só o "Como funciona" tinha: o bloco sobe
                com fade ao chegar na tela, uma vez. */}
            <FadeInView className={cn("container mx-auto px-4", width === "narrow" && "max-w-3xl")}>
                {children}
            </FadeInView>
        </section>
    )
}

/**
 * Título à esquerda, cartões à direita — só a partir de `lg`. Antes, "Mercados-
 * alvo" e "Perfis de compra" eram a mesma coluna estreita das seções de texto,
 * e a página inteira lia como um bloco só. Abaixo de `lg` a ordem continua
 * título → cartões → fecho, na coluna de 48rem de sempre.
 *
 * Espera três filhos: o título, os cartões (`SPLIT_CARDS`) e o fecho
 * (`SPLIT_ASIDE`). No desktop o fecho desce para baixo do título e os cartões
 * ocupam a coluna da direita inteira.
 */
export function SplitLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto grid max-w-3xl gap-y-6 lg:max-w-6xl lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16">
            {children}
        </div>
    )
}

export const SPLIT_CARDS = "lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center"
export const SPLIT_ASIDE = "lg:col-start-1 lg:row-start-2 lg:self-start"

/**
 * No celular os cartões viram um trilho de rolagem lateral em vez de pilha: a
 * home tinha ~12 telas de altura. O trilho sangra até a borda da tela (-mx-4) e
 * cada cartão ocupa menos que a largura, para o seguinte aparecer cortado e
 * avisar que há mais. De `sm` em diante volta a ser grade.
 */
export const CARD_RAIL =
    "-mx-4 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0"

/**
 * Par sobrancelha + título, repetido em sete seções da landing.
 */
export function SectionHeading({
    eyebrow,
    title,
    intro,
    centered = false,
}: {
    eyebrow: string
    title: string
    intro?: string
    centered?: boolean
}) {
    return (
        <div className={cn(centered && "mx-auto max-w-2xl text-center")}>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-accent-strong">
                {eyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
            {intro && <p className="mt-4 leading-7 text-muted-foreground">{intro}</p>}
        </div>
    )
}
