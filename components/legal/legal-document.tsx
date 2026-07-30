import type { LegalDocument } from "@/content/legal"

export function LegalDocumentView({
    document,
    lastUpdatedLabel,
}: {
    document: LegalDocument
    lastUpdatedLabel: string
}) {
    return (
        <div className="container mx-auto max-w-3xl px-4 py-16">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{document.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{lastUpdatedLabel}</p>

            <div className="mt-8 space-y-8 text-sm leading-7 text-muted-foreground">
                {document.sections.map((section) => (
                    <section key={section.id}>
                        <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
                        {section.blocks.map((block, index) =>
                            block.kind === "paragrafo" ? (
                                <p key={index} className="mt-2">{block.texto}</p>
                            ) : (
                                <ul key={index} className="mt-2 list-disc space-y-1 pl-5">
                                    {block.itens.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            )
                        )}
                    </section>
                ))}
            </div>
        </div>
    )
}
