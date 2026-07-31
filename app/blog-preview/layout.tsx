import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import "../globals.css"

// Prévia nunca é indexada: é conteúdo não publicado, atrás de login.
export const metadata: Metadata = {
    robots: { index: false, follow: false },
}

/**
 * Root layout da prévia.
 *
 * Existe porque esta rota fica fora dos dois root layouts do projeto (o do
 * funil, em `app/[locale]`, e o das áreas internas, em `app/(app)`) — e sem um
 * layout próprio ela sai sem `globals.css`, ou seja, sem Tailwind: nada de
 * `prose`, de largura de coluna, de tipografia. Uma prévia sem CSS mostraria
 * algo que o leitor nunca verá, que é o oposto do que ela existe para fazer.
 *
 * O `lang` fica em português porque o idioma do POST vem de `?locale=` e é
 * aplicado pelo `PostArticle`, no `dir` e no conteúdo; este é só o documento
 * que embrulha a prévia.
 */
export default function BlogPreviewLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body className={`${GeistSans.variable} font-sans antialiased`}>{children}</body>
        </html>
    )
}
