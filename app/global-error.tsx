"use client"

// Último boundary do App Router: pega erro que estourou no próprio layout
// raiz, onde nenhum error.tsx de segmento chega. Como substitui o <html>
// inteiro, não dá para usar next-intl aqui — o provider de mensagens vive
// abaixo deste ponto. Por isso o texto é fixo em português.

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
    error,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        Sentry.captureException(error)
    }, [error])

    return (
        <html lang="pt">
            <body>
                <div style={{
                    display: 'flex',
                    minHeight: '100vh',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    fontFamily: 'system-ui, sans-serif',
                    textAlign: 'center',
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Algo deu errado
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: '#666' }}>
                            Ocorreu um erro inesperado. Recarregue a página para tentar novamente.
                        </p>
                    </div>
                </div>
            </body>
        </html>
    )
}
