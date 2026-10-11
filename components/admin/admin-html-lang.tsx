"use client"

import { useEffect } from "react"

/**
 * Mantém `<html lang/dir>` no idioma da conta durante a navegação client-side.
 *
 * O root layout já resolve o idioma certo no servidor quando a requisição
 * chega direto em /super-admin, mas root layout não re-renderiza em navegação
 * suave: quem entra no admin vindo do CRM por link herdaria o `lang` do cookie
 * do funil. Ao sair, devolve o idioma do site que o root layout deixou em
 * `data-site-lang` — não o valor de antes, que é o da conta quando a página foi
 * aberta direto no painel.
 */
export function AdminHtmlLang({ lang, dir }: { lang: string; dir: "ltr" | "rtl" }) {
    useEffect(() => {
        const html = document.documentElement
        const site = {
            lang: html.dataset.siteLang ?? html.lang,
            dir: html.dataset.siteDir ?? html.dir,
        }
        html.lang = lang
        html.dir = dir
        return () => {
            html.lang = site.lang
            html.dir = site.dir
        }
    }, [lang, dir])

    return null
}
