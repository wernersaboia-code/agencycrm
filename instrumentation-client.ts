// Inicialização do Sentry no navegador. O Next carrega este arquivo antes de
// qualquer código da aplicação, então erros de hidratação também são pegos.

import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    enabled: process.env.NODE_ENV === 'production',
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,

    // Sem tracing e sem Session Replay: os dois consomem a cota gratuita
    // rápido, e o Replay ainda soma peso ao bundle do cliente.
    tracesSampleRate: 0,

    sendDefaultPii: false,

    // Ruído que não é bug nosso e consumiria cota à toa: extensão de
    // navegador, tradutor automático, e o aviso de ResizeObserver que o
    // Chrome dispara sem nada estar quebrado.
    ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
        /^Failed to fetch$/,
        /^NetworkError/,
        /^Load failed$/,
    ],
    denyUrls: [
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i,
    ],
})

// Sem isso, erro que acontece durante navegação entre rotas perde o contexto
// de qual página o usuário estava saindo.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
