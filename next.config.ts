// next.config.ts

import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
    // Módulo nativo (desenha as páginas da amostra gratuita, em
    // lib/free-sample/paginas.ts): o bundler não pode embuti-lo.
    serverExternalPackages: ['@napi-rs/canvas'],
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
    // Fichas desativadas que tinham substituta. Sem isto o endereço antigo
    // vira 404 e o que ele já tinha de indexação se perde. Um par por ficha:
    // sem prefixo (português) e com prefixo de idioma.
    async redirects() {
        const fichasSubstituidas: Array<[antiga: string, nova: string]> = [
            // 10.11.2026: dois estudos de HoReCa na Sérvia com o mesmo PDF.
            [
                'horeca-foodservice-market-serbia',
                'horeca-foodservice-market-serbia-with-the-most-important-importers-and-distributors',
            ],
        ]

        return fichasSubstituidas.flatMap(([antiga, nova]) => [
            { source: `/list/${antiga}`, destination: `/list/${nova}`, permanent: true },
            {
                source: `/:locale(pt|de|en|es|fr|ar|it|nl)/list/${antiga}`,
                destination: `/:locale/list/${nova}`,
                permanent: true,
            },
        ])
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
                key: 'Content-Security-Policy',
                value: `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co https://api.paypal.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io; frame-src 'self' https://*.supabase.co https://www.paypal.com https://www.sandbox.paypal.com; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'`,
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
                key: 'Permissions-Policy',
                value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
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
