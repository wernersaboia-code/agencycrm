// lib/auth/password-policy.ts
//
// A regra de senha do cadastro, num lugar so.
//
// Devolve CODIGO, nao frase: a tela precisa da mensagem traduzida nos 7
// idiomas, e uma frase em portugues vinda daqui seria exatamente o problema
// que este trabalho esta consertando.
//
// A regra vale em tres camadas — tela, rota e painel do Supabase. A tela e
// burlavel, entao a que realmente conta e a da rota; a da tela existe para a
// pessoa ler o motivo antes de enviar.

export const PASSWORD_MIN_LENGTH = 8

export type PasswordProblem = "curta" | "semLetra" | "semNumero"

/** Devolve o primeiro problema encontrado, ou null quando a senha passa. */
export function validarSenha(senha: string): PasswordProblem | null {
    if (senha.length < PASSWORD_MIN_LENGTH) {
        return "curta"
    }

    // \p{L} em vez de [a-z]: o mercado e europeu e "münchen" tem letras.
    if (!/\p{L}/u.test(senha)) {
        return "semLetra"
    }

    if (!/\d/.test(senha)) {
        return "semNumero"
    }

    return null
}
