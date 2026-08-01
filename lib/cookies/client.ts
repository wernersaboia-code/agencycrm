"use client"

/**
 * Grava cookie de preferência direto no navegador.
 *
 * Por que não Server Action: os IDs de Server Action mudam a cada build, então
 * uma aba aberta durante um deploy manda um ID que já não existe e recebe 404
 * (`UnrecognizedActionError`). Para cookie de preferência isso é evitável —
 * `CURRENCY` e `NEXT_LOCALE` não são `httpOnly`, não guardam segredo e já são
 * LIDOS no cliente. Gravar aqui elimina a dependência de versão do servidor.
 *
 * Mantém os mesmos atributos que o servidor usava (`path`, `sameSite`,
 * `maxAge`), senão o cookie gravado aqui não substituiria o gravado lá.
 */
export function writePreferenceCookie(name: string, value: string, maxAgeSeconds: number): void {
    if (typeof document === "undefined") return

    // `secure` só em HTTPS: em http://localhost o navegador descarta o cookie
    // marcado como secure, e o seletor pararia de funcionar em desenvolvimento.
    const secure = location.protocol === "https:" ? "; secure" : ""

    document.cookie =
        `${name}=${encodeURIComponent(value)}` +
        `; path=/; max-age=${maxAgeSeconds}; samesite=lax${secure}`
}

/** Um ano, o mesmo prazo que as Server Actions de preferência usavam. */
export const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
