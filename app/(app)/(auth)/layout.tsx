// app/(auth)/layout.tsx

import type { Metadata } from "next"

// Nenhuma tela de autenticação entra em busca. Elas respondem 200 para
// qualquer visitante e não têm conteúdo para quem chega do buscador — o
// Search Console de agosto mostrou /sign-in?lang=nl entre as dez páginas
// mais exibidas do site, com 3 impressões e nenhum clique.
//
// Fica aqui, e não em cada página, porque vale para sign-in, sign-up e
// qualquer tela que entre neste grupo depois. Sobrescreve o
// `robots: { index: true, follow: true }` de app/(app)/layout.tsx, que é o
// layout pai — no Next as chaves de metadata são mescladas por campo, e a
// mais próxima da rota vence.
//
// Sem entrada correspondente no robots.ts de propósito: bloquear o rastreio
// impediria o Google de ler este próprio noindex, e as URLs já indexadas
// ficariam no índice justamente por isso.
export const metadata: Metadata = {
    robots: { index: false, follow: false },
}

export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-4xl p-6">
                {children}
            </div>
        </div>
    )
}
