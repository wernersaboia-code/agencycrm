/**
 * Validação do destino pós-confirmação de e-mail.
 *
 * O link de confirmação carrega para onde ir depois (`?next=`). Como esse
 * parâmetro chega de fora, aceitá-lo sem filtro deixaria qualquer pessoa
 * montar um link do NOSSO domínio que joga a vítima em um site controlado por
 * ela — com a credibilidade do nosso e-mail por trás. É o open redirect.
 *
 * Só passam caminhos internos: começam com uma barra e não com duas (que o
 * navegador leria como "//host.malicioso" — outro domínio) nem com barra
 * invertida (que alguns navegadores normalizam para barra).
 */

export const DEFAULT_POST_CONFIRM_REDIRECT = "/my-purchases"

export function safeInternalPath(
    candidate: string | null,
    fallback: string = DEFAULT_POST_CONFIRM_REDIRECT
): string {
    if (!candidate) {
        return fallback
    }

    if (!candidate.startsWith("/")) {
        return fallback
    }

    // "//evil.com" e "/\evil.com" saem do nosso domínio apesar da barra inicial.
    if (candidate.startsWith("//") || candidate.startsWith("/\\")) {
        return fallback
    }

    // Um destino absoluto disfarçado ("/https://evil.com") não nos interessa,
    // e nem caracteres de controle usados para quebrar a validação.
    if (/[\x00-\x1f]/.test(candidate)) {
        return fallback
    }

    return candidate
}
