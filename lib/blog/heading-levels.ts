// lib/blog/heading-levels.ts

/**
 * O título do post já é o <h1> da página (components/blog/post-article.tsx).
 * Um <h1> dentro do corpo vira um segundo, terceiro, oitavo H1 — foi o que
 * aconteceu com os primeiros posts, escritos quando o editor não mostrava
 * diferença visual entre os níveis.
 *
 * Quando o corpo tem <h1>, a hierarquia inteira desce um degrau: h1 vira h2 e
 * h2 vira h3. O h3 fica onde está — o editor só oferece até aí, e um h4 que
 * ele não conhece voltaria como parágrafo na próxima edição.
 *
 * Sem <h1> no corpo, nada muda: a função é idempotente e pode rodar na
 * leitura, no editor e no salvamento sem acumular efeito.
 *
 * Só toca no nome da tag. Atributos (o text-align do alinhamento) e texto
 * passam como vieram.
 */
export function rebaixarTitulosDoCorpo(html: string): string {
    if (!/<h1[\s>]/i.test(html)) return html

    return html
        .replace(/<(\/?)h2(?=[\s>])/gi, "<$1h3")
        .replace(/<(\/?)h1(?=[\s>])/gi, "<$1h2")
}
