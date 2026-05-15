"use client"

import { useEffect } from "react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("App Error:", error)
    }, [error])

    return (
        <html>
            <body className="flex min-h-screen items-center justify-center p-8 bg-background">
                <div className="text-center max-w-md">
                    <h2 className="text-lg font-semibold text-foreground mb-2">
                        Erro inesperado
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Ocorreu um erro critico na aplicacao. Tente recarregar a pagina.
                    </p>
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Tentar novamente
                    </button>
                </div>
            </body>
        </html>
    )
}
