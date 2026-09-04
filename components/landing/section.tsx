import { ArrowRight } from "lucide-react"
import { Link } from "@/lib/i18n/navigation"
import { cn } from "@/lib/utils"

type SectionTone = "default" | "muted" | "deep"
type SectionWidth = "narrow" | "wide"
type SectionSize = "default" | "lead"

/**
 * Casca padrão das seções da landing: espaçamento, superfície e largura do
 * container num lugar só. Antes cada seção repetia essas classes e elas já
 * tinham divergido — `py-14`, `py-14 md:py-16` e `py-14 md:py-18` conviviam.
 *
 * O `tone` alterna o fundo para a página não virar um bloco contínuo de uma cor
 * só. A escolha mora em cada seção, e não numa prop vinda da página, porque a
 * landing é renderizada por rota de locale: com prop, cada idioma poderia acabar
 * com um ritmo visual diferente.
 *
 * O preço disso é que a alternância não se garante sozinha — e já tinha
 * quebrado: quatro seções `default` seguidas logo no topo, exatamente o bloco
 * contínuo que o `tone` existe para evitar. A sequência inteira está listada em
 * `app/[locale]/page.tsx`, junto da ordem das seções; mexer no `tone` de uma
 * seção sem olhar aquela lista quebra o par das vizinhas.
 *
 * `deep` é a quebra tonal do meio da página: superfície escura de marca, uma só
 * vez, no lugar que a referência dá ao bloco cinza do "Policy Engine". Ele
 * redefine os tokens de superfície no próprio subárvore (ver `.vitrine-deep` em
 * `globals.css`), então os filhos continuam usando `bg-card` e
 * `text-muted-foreground` normalmente. Usar em UMA seção: duas quebras não são
 * quebra, são listras.
 */
export function Section({
    id,
    tone = "default",
    width = "wide",
    size = "default",
    className,
    children,
}: {
    id?: string
    tone?: SectionTone
    width?: SectionWidth
    size?: SectionSize
    className?: string
    children: React.ReactNode
}) {
    return (
        <section
            id={id}
            className={cn(
                // Sem filete entre seções. O `border-t` estava em todas e fazia a
                // home ler como documento, não como landing: a referência separa
                // bloco de bloco pela troca de superfície, nunca por linha. Com a
                // alternância de `tone` corrigida, a linha vira ruído — e onde
                // duas seções do mesmo tom encostam (quando `featured` ou
                // `freeSample` devolvem `null`), o respiro de py-20/28 já é a
                // pausa que o filete tentava dar.
                size === "lead" ? "py-24 md:py-32" : "py-20 md:py-28",
                tone === "muted" && "bg-muted/40",
                tone === "deep" && "vitrine-deep",
                tone === "default" && "bg-background",
                className
            )}
        >
            <div className={cn("container mx-auto px-4", width === "narrow" && "max-w-3xl")}>
                {children}
            </div>
        </section>
    )
}

/**
 * Par sobrancelha + título, repetido em oito seções da landing.
 *
 * A escala é de vitrine, não de artigo: sobrancelha pequena e muito espaçada
 * sobre um título grande é metade da sensação de "premium" da referência. O
 * título só chega aos 48px no `lg` — no celular um `text-5xl` viraria três
 * linhas e comeria a dobra.
 *
 * `eyebrow` é opcional: uma seção cujo título já é a própria etiqueta ("Estudos
 * em destaque") não ganha nada repetindo a ideia numa sobrancelha acima.
 *
 * `action` é o "Explore →" da referência: um link no canto superior direito que
 * dá saída para a página onde aquele assunto continua. Ele é o que transforma
 * uma pilha de seções num índice — mas só quando LEVA a algum lugar novo. Três
 * seções apontando para `/catalog` seriam três vezes o mesmo botão com nomes
 * diferentes, então ele fica de fora de quem já tem saída própria no corpo (o
 * marquee de mercados, os cards do blog, o botão de cada estudo em destaque).
 */
export function SectionHeading({
    eyebrow,
    title,
    intro,
    centered = false,
    action,
}: {
    eyebrow?: string
    title: string
    intro?: string
    centered?: boolean
    action?: { href: string; label: string }
}) {
    const texto = (
        <div className={cn(centered && "mx-auto max-w-2xl text-center")}>
            {eyebrow && (
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent-strong">
                    {eyebrow}
                </p>
            )}
            <h2
                className={cn(
                    "text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl",
                    eyebrow && "mt-3"
                )}
            >
                {title}
            </h2>
            {intro && (
                <p
                    className={cn(
                        "mt-5 text-lg leading-8 text-muted-foreground",
                        !centered && "max-w-2xl"
                    )}
                >
                    {intro}
                </p>
            )}
        </div>
    )

    if (!action) return texto

    // Centralizado, o link não tem canto para ocupar: vai embaixo, no eixo do
    // título. Fora isso ele alinha pelo topo, na altura da sobrancelha, que é
    // onde a referência o põe.
    if (centered) {
        return (
            <div>
                {texto}
                <div className="mt-8 text-center">
                    <SectionAction {...action} />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
            {texto}
            <div className="shrink-0 pt-1">
                <SectionAction {...action} />
            </div>
        </div>
    )
}

function SectionAction({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-brand-accent hover:text-brand-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        >
            {label}
            <ArrowRight className="h-3.5 w-3.5" />
        </Link>
    )
}
