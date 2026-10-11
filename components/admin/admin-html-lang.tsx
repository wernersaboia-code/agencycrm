"use client"

import { useEffect } from "react"

/**
 * Mantém `<html lang/dir>` no idioma da conta durante a navegação client-side.
 *
 * O root layout já resolve o idioma certo no servidor quando a requisição
 * chega direto em /super-admin, mas root layout não re-renderiza em navegação
 * suave: quem entra no admin vindo do CRM por link herdaria o `lang` do cookie
 * do funil. Ao sair, devolve o valor anterior para o CRM não herdar o do admin.
 */
export function AdminHtmlLang({ lang, dir }: { lang: string; dir: "ltr" | "rtl" }) {
    useEffect(() => {
        const html = document.documentElement
        const anterior = { lang: html.lang, dir: html.dir }
        html.lang = lang
        html.dir = dir
        return () => {
            html.lang = anterior.lang
            html.dir = anterior.dir
        }
    }, [lang, dir])

    return null
}
