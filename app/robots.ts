export default function robots() {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/dashboard", "/crm", "/super-admin", "/api/"],
            },
        ],
        sitemap: `${process.env.NEXT_PUBLIC_APP_URL || "https://easyprospect.com"}/sitemap.xml`,
    }
}
