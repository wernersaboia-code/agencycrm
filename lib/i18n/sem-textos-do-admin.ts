// lib/i18n/sem-textos-do-admin.ts
import type { AbstractIntlMessages } from "next-intl"

/**
 * As mensagens sem o bloco `admin`, para o `NextIntlClientProvider` das áreas
 * que não são o painel (site público, login, cadastro).
 *
 * Tudo que entra no provider de cliente vai inteiro para o navegador. O bloco
 * `admin` era 57% do texto de cada página pública (38 KB de 67 KB em pt) e
 * mostrava a estrutura do painel a quem abrisse o código-fonte. Nenhum
 * componente fora do painel usa `admin.*`; o super-admin monta o próprio
 * provider com as mensagens completas.
 *
 * Só o provider de cliente é filtrado: Server Components continuam lendo as
 * mensagens completas por `getTranslations`, que não vai para o navegador.
 */
export function semTextosDoAdmin(messages: AbstractIntlMessages): AbstractIntlMessages {
    return Object.fromEntries(Object.entries(messages).filter(([namespace]) => namespace !== "admin"))
}
