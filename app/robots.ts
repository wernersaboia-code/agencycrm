export default function robots() {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/dashboard", "/crm", "/pricing", "/super-admin", "/api/"],
            },
        ],
        sitemap: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.easyprospect.com.br"}/sitemap.xml`,
    }
}
