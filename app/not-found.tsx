import Link from "next/link"
import { GeistSans } from "geist/font/sans"
import "./globals.css"

/**
 * 404 global — para URLs que não casam com nenhuma rota.
 *
 * Traz o próprio `<html>`/`<body>` porque, com dois root layouts (o do funil em
 * `app/[locale]` e o das áreas internas em `app/(app)`), esta página fica fora
 * dos dois e não herda nenhum deles.
 *
 * E, principalmente, ela NÃO pode ler cookie nem idioma: o Next pré-renderiza
 * esta rota, e qualquer acesso a `cookies()` em tempo de execução derruba a
 * página com "Page changed from static to dynamic at runtime" — um 500 no lugar
 * do 404. Era o que acontecia com qualquer caminho inexistente que tivesse
 * ponto no nome (`/llms.txt`, `/ads.txt`), porque esses escapam do proxy e
 * chegam até aqui. Por isso o texto está fixo em português, o idioma padrão do
 * site: é a única página que não pode perguntar qual é o idioma.
 */
export default function NotFound() {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
        <body className={`${GeistSans.variable} font-sans antialiased`}>
        <main
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
                padding: "2rem",
                textAlign: "center",
            }}
        >
            <p style={{ fontSize: "0.875rem", letterSpacing: "0.1em", opacity: 0.6 }}>404</p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Página não encontrada</h1>
            <p style={{ opacity: 0.7, maxWidth: "28rem" }}>
                O endereço que você abriu não existe ou foi movido.
            </p>
            <Link
                href="/"
                style={{
                    marginTop: "0.5rem",
                    borderRadius: "0.5rem",
                    border: "1px solid currentColor",
                    padding: "0.5rem 1.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    textDecoration: "none",
                }}
            >
                Voltar para a página inicial
            </Link>
        </main>
        </body>
        </html>
    )
}
