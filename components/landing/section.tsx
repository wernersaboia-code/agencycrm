import { cn } from "@/lib/utils"

type SectionTone = "default" | "muted"
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
                "border-t border-border py-14 md:py-16",
                tone === "muted" ? "bg-muted/40" : "bg-background",
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
