import countries from "i18n-iso-countries"
import portuguese from "i18n-iso-countries/langs/pt.json"

countries.registerLocale(portuguese)

function alpha2(value: string) {
    const normalized = value.trim().toUpperCase()
    if (/^[A-Z]{2}$/.test(normalized)) return normalized
    if (/^[A-Z]{3}$/.test(normalized)) return countries.alpha3ToAlpha2(normalized) || null
    return null
}

export function countryLabel(value: string, locale = "pt") {
    const code = alpha2(value)
    if (!code) return { flag: "🌐", name: value || "País não identificado" }
    const flag = String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0)))
    return { flag, name: countries.getName(code, locale) || code }
}
