export default function robots() {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                // /my-purchases vive no segmento [locale], então precisa das
                // duas formas: a sem prefixo e o curinga /*/my-purchases para
                // /de/my-purchases e demais idiomas. As outras entradas ficam
                // fora de [locale] e nunca ganham prefixo.
                disallow: [
                    "/dashboard",
                    "/crm",
                    "/pricing",
                    "/super-admin",
                    "/api/",
                    "/my-purchases",
                    "/*/my-purchases",
                ],
            },
        ],
        sitemap: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.easyprospect.com.br"}/sitemap.xml`,
    }
}
