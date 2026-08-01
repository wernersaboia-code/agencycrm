// Ponto de entrada de instrumentação do Next. Cada runtime carrega o seu
// próprio init: o bundle do Edge não pode importar o SDK de Node.

import * as Sentry from '@sentry/nextjs'

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./sentry.server.config')
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('./sentry.edge.config')
    }
}

// Sem este export, erro dentro de Server Component não chega ao Sentry: o Next
// captura a exceção no próprio boundary e ela nunca sobe até o SDK.
export const onRequestError = Sentry.captureRequestError
