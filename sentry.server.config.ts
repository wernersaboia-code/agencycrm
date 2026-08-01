// Inicialização do Sentry no runtime Node (Server Components, Server Actions,
// route handlers). Carregado por instrumentation.ts.

import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Só envia em produção. Erro de desenvolvimento aparece no terminal e não
    // precisa consumir cota — o plano gratuito tem limite mensal de eventos.
    enabled: process.env.NODE_ENV === 'production',

    // Separa produção de preview no painel: sem isso, cada deploy de branch
    // polui a lista de issues do site no ar.
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,

    // Tracing desligado. Spans de performance são o que estoura a cota
    // gratuita mais rápido; para acompanhar erro, não fazem falta.
    tracesSampleRate: 0,

    // Não envia cookies, headers de autenticação nem corpo da requisição.
    // O checkout trafega dados de cliente e pagamento — nada disso precisa
    // sair daqui.
    sendDefaultPii: false,
})
