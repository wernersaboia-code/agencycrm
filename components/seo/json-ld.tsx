import { serializeJsonLd } from "@/lib/seo/schema"

/**
 * Renderiza um bloco JSON-LD. Componente burro de propósito: toda a lógica
 * de montagem vive em lib/seo/schema.ts, que é testável sem DOM.
 *
 * A serialização escapa </script> (via serializeJsonLd) porque este é o
 * primeiro consumidor a injetar strings vindas do banco (nome/descrição de
 * lista) — sem isso um valor malicioso poderia fechar a tag prematuramente.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
        />
    )
}
