// next.config.ts

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
                key: 'Content-Security-Policy',
                value: `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co https://api.paypal.com https://api.resend.com; frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'`,
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

export default withNextIntl(nextConfig)
