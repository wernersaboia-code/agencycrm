// next.config.ts

import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
    // Configuração para imagens externas
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'flagcdn.com',
            },
        ],
    },
    async headers() {
        // 'unsafe-eval' só é necessário em dev (Turbopack/HMR usam eval para
        // recarregar módulos). Em produção o bundle do Next não precisa dele,
        // então removemos para reduzir a superfície de XSS.
        const scriptSrc = process.env.NODE_ENV === 'production'
            ? "'self' 'unsafe-inline'"
            : "'self' 'unsafe-inline' 'unsafe-eval'"

        const securityHeaders = [
            {
                // O Paddle.js carrega de cdn.paddle.com e o overlay abre em iframe.
                // Sem essas três liberações o botão não faz nada, e o único sinal é um
                // erro no console — falha cara de diagnosticar depois.
                key: 'Content-Security-Policy',
                value: `default-src 'self'; script-src ${scriptSrc} https://cdn.paddle.com https://sandbox-cdn.paddle.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co https://api.paypal.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io https://*.paddle.com; frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com https://*.paddle.com; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'`,
            },
            {
                key: 'Referrer-Policy',
                value: 'strict-origin-when-cross-origin',
            },
            {
                key: 'Strict-Transport-Security',
                value: 'max-age=63072000; includeSubDomains; preload',
            },
            {
                key: 'X-Content-Type-Options',
                value: 'nosniff',
            },
            {
                key: 'X-Frame-Options',
                value: 'DENY',
            },
            {
                // payment=() desabilitaria a Payment Request API para o
                // documento E para todo iframe filho — e é por dentro de um
                // iframe do Paddle que Apple Pay e Google Pay funcionam no
                // overlay. Liberar só para self e paddle.com mantém as
                // carteiras digitais de pé sem abrir a API para qualquer
                // origem. camera, microphone, geolocation e usb continuam
                // fechados: nada no fluxo de checkout precisa deles.
                key: 'Permissions-Policy',
                value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://*.paddle.com"), usb=()',
            },
        ]

        return [
            {
                source: '/:path*',
                headers: securityHeaders,
            },
            {
                source: '/api/:path*',
                headers: [
                    ...securityHeaders,
                    {
                        key: 'Cache-Control',
                        value: 'no-store',
                    },
                ],
            },
        ]
    },
}

export default withSentryConfig(withNextIntl(nextConfig), {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // Source maps só são enviados quando existe token. Sem ele o build segue
    // normal (o deploy não pode quebrar porque falta uma variável de
    // observabilidade) — mas as stack traces chegam minificadas.
    // deleteSourcemapsAfterUpload: os mapas ficam só no Sentry; publicá-los
    // junto com o bundle expõe o código-fonte para qualquer visitante.
    sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
        deleteSourcemapsAfterUpload: true,
    },

    widenClientFileUpload: true,

    silent: !process.env.CI,
    telemetry: false,
})
