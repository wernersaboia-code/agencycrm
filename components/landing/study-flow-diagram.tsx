/**
 * O mecanismo por trás de um estudo, desenhado: pesquisa → conferência de cada
 * empresa em fontes públicas → estudo publicado, com a revisão periódica
 * devolvendo o estudo à conferência.
 *
 * Ocupa o lugar que a referência (duna.com) dá ao diagrama do "Policy Engine":
 * o momento em que a página mostra COMO a coisa funciona em vez de afirmar que
 * funciona bem. A diferença é que aqui o desenho não é decorativo — cada nó é
 * uma etapa que existe de verdade, e as três fontes são exatamente as que o
 * texto de qualidade de dados já nomeia (site institucional, presença digital,
 * registros disponíveis). Não é ícone em círculo.
 *
 * SVG inline em vez de imagem, e as cores em classes (`.fluxo-*` em
 * `globals.css`) em vez de atributos `fill`/`stroke`: assim o desenho acompanha
 * o tema e a superfície escura pelos tokens, e não depende de `var()` dentro de
 * atributo de apresentação, que é terreno incerto entre navegadores.
 *
 * Em tela estreita o desenho rola dentro do próprio contêiner em vez de
 * encolher até ficar ilegível.
 */
export function StudyFlowDiagram({
    step1,
    step2,
    step3,
    sources,
    loop,
    alt,
}: {
    step1: string
    step2: string
    step3: string
    sources: string[]
    loop: string
    /** Descrição do fluxo em palavras, para quem não vê o desenho. */
    alt: string
}) {
    const fontes = sources.slice(0, 3)
    const centrosDasFontes = [180, 480, 780]

    return (
        <div className="-mx-4 overflow-x-auto px-4 pb-2">
            <svg
                viewBox="0 0 960 260"
                role="img"
                aria-label={alt}
                strokeWidth="1.5"
                className="h-auto w-full min-w-[680px]"
            >
                <defs>
                    <marker
                        id="fluxo-ponta"
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path d="M0 0 L10 5 L0 10 z" className="fluxo-seta" />
                    </marker>
                </defs>

                {/* Revisão periódica: volta do estudo publicado para a conferência.
                    Tracejada porque não acontece a cada compra, e sim de tempos em
                    tempos — sólida leria como parte do caminho de ida. */}
                <path
                    d="M796 70 C 796 12, 480 12, 480 70"
                    fill="none"
                    className="fluxo-linha"
                    strokeDasharray="5 5"
                    markerEnd="url(#fluxo-ponta)"
                />
                {/* Tampa atrás do rótulo: corta a linha tracejada para o texto não
                    ficar riscado no ponto mais alto do arco. */}
                <rect x="561" y="15" width="154" height="23" rx="11" className="fluxo-tampa" />
                <text
                    x="638"
                    y="31"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    className="fluxo-rotulo-marca"
                >
                    {loop}
                </text>

                {/* Caminho de ida */}
                <Passo x={24} rotulo={step1} />
                <Passo x={340} rotulo={step2} destaque />
                <Passo x={656} rotulo={step3} />

                <line
                    x1="304"
                    y1="104"
                    x2="340"
                    y2="104"
                    className="fluxo-linha"
                    markerEnd="url(#fluxo-ponta)"
                />
                <line
                    x1="620"
                    y1="104"
                    x2="656"
                    y2="104"
                    className="fluxo-linha"
                    markerEnd="url(#fluxo-ponta)"
                />

                {/* As três fontes entram na conferência por baixo */}
                <line
                    x1="480"
                    y1="170"
                    x2="480"
                    y2="138"
                    className="fluxo-linha"
                    markerEnd="url(#fluxo-ponta)"
                />
                <path d="M180 170 H 780" fill="none" className="fluxo-linha-fraca" />
                {centrosDasFontes.map((cx) => (
                    <line key={cx} x1={cx} y1="196" x2={cx} y2="170" className="fluxo-linha-fraca" />
                ))}

                {fontes.map((fonte, i) => (
                    <g key={fonte}>
                        <rect
                            x={centrosDasFontes[i] - 120}
                            y="196"
                            width="240"
                            height="46"
                            rx="23"
                            className="fluxo-chip"
                        />
                        <text
                            x={centrosDasFontes[i]}
                            y="224"
                            textAnchor="middle"
                            fontSize="13"
                            className="fluxo-rotulo-fraco"
                        >
                            {fonte}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    )
}

function Passo({ x, rotulo, destaque }: { x: number; rotulo: string; destaque?: boolean }) {
    return (
        <g>
            <rect
                x={x}
                y="70"
                width="280"
                height="68"
                rx="16"
                className={destaque ? "fluxo-caixa-destaque" : "fluxo-caixa"}
            />
            <text
                x={x + 140}
                y="110"
                textAnchor="middle"
                fontSize="16"
                fontWeight="600"
                className="fluxo-rotulo"
            >
                {rotulo}
            </text>
        </g>
    )
}
