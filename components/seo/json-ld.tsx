/**
 * Renderiza um bloco JSON-LD. Componente burro de propósito: toda a lógica
 * de montagem vive em lib/seo/schema.ts, que é testável sem DOM.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    )
}
