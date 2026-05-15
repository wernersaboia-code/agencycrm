// next.config.ts

import type { NextConfig } from 'next'

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
        const securityHeaders = [
            {
                key: 'Content-Security-Policy',
                value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co https://api.paypal.com https://api.resend.com; frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
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

export default nextConfig
