import type { AboutDocument } from "./types"

// Transcrição literal de "Por_que_EasyProspect_PT-BR.docx".
// Não reescrever: o sócio pediu o texto dele palavra por palavra. Mudança aqui
// só a partir de uma versão nova do documento.
//
// Exceção registrada: os dois últimos parágrafos de "Origem dos nossos dados" não estão
// no documento deste idioma — são a tradução do trecho sobre disparo em massa
// que só o documento alemão traz, incluído nos 7 a pedido do Werner.
const aboutPt: AboutDocument = {
    eyebrow: "Por que a EasyProspect?",
    title: "Seu parceiro para uma entrada bem-sucedida em mercados internacionais",
    intro: [
        { kind: "paragrafo", texto: "Novos mercados de exportação oferecem enormes oportunidades de crescimento. Ao mesmo tempo, a busca por importadores, distribuidores e informações de mercado confiáveis costuma levar semanas ou até meses." },
        { kind: "paragrafo", texto: "A EasyProspect foi desenvolvida para tornar esse processo muito mais simples." },
        { kind: "paragrafo", texto: "Apoiamos fabricantes, empresas de marcas e exportadores a conquistar novos mercados com estudos profissionais de entrada em mercado e diretórios cuidadosamente pesquisados de importadores e distribuidores." },
        { kind: "paragrafo", texto: "Nossos estudos combinam muitos anos de experiência em vendas internacionais com metodologias modernas de pesquisa. Utilizamos tecnologias de IA para análise e uma revisão manual final de qualidade." },
        { kind: "paragrafo", texto: "O resultado são informações estruturadas e práticas que ajudam você a tomar decisões fundamentadas e identificar os parceiros comerciais ideais para seus produtos." },
    ],
    sections: [
        {
            id: "metodologia",
            heading: "Nossa metodologia",
            sub: "Pesquisa cuidadosa em vez de listas confusas",
            blocks: [
                { kind: "paragrafo", texto: "Na EasyProspect, o foco não está na quantidade de dados, mas em sua relevância prática." },
                { kind: "paragrafo", texto: "Para cada estudo de entrada em mercado, diversas fontes públicas são analisadas sistematicamente. Tecnologias modernas de IA apoiam a pesquisa, análise e estruturação dos dados. Em seguida, todos os resultados são verificados quanto à plausibilidade e utilidade para exportação." },
                { kind: "paragrafo", texto: "Nosso objetivo não é listar o maior número possível de empresas, mas identificar aquelas realmente relevantes para o seu projeto de exportação." },
            ],
        },
        {
            id: "fontes",
            heading: "Origem dos nossos dados",
            blocks: [
                { kind: "lista", itens: [
                    "Sites de empresas",
                    "Câmaras de comércio",
                    "Associações setoriais",
                    "Catálogos de feiras",
                    "Diretórios empresariais",
                    "Portais especializados",
                    "Outras informações econômicas de acesso público",
                ] },
                { kind: "paragrafo", texto: "Antes da publicação, os dados são verificados quanto à plausibilidade, integridade e utilidade prática. Como contatos e estruturas empresariais mudam regularmente, nossos estudos são atualizados periodicamente." },
                { kind: "paragrafo", texto: "Nossos diretórios de importadores não se destinam a disparos de e-mail em massa." },
                { kind: "paragrafo", texto: "Eles servem como base fundamentada para uma abordagem individual e cuidadosamente preparada de potenciais parceiros comerciais — porque, no comércio internacional, relações de negócio bem-sucedidas nascem principalmente de confiança e contato pessoal." },
            ],
        },
        {
            id: "verificacao",
            heading: "Verificação das empresas",
            blocks: [
                { kind: "lista", itens: [
                    "se a empresa atua no respectivo setor",
                    "se existem atividades de importação ou distribuição",
                    "se possui presença profissional",
                    "se há dados de contato atualizados",
                    "se pode ser considerada um potencial parceiro comercial",
                ] },
                { kind: "paragrafo", texto: "Essa verificação não substitui uma qualificação comercial individual, mas aumenta a probabilidade de que as empresas listadas sejam relevantes." },
            ],
        },
        {
            id: "atualizacao",
            heading: "Atualização Regular",
            blocks: [
                { kind: "paragrafo", texto: "Os mercados internacionais estão em constante transformação. Por isso revisamos e atualizamos regularmente nossos estudos e diretórios." },
            ],
        },
        {
            id: "entrega",
            heading: "O que você recebe",
            blocks: [
                { kind: "lista", itens: [
                    "Visão geral do mercado-alvo",
                    "Análise do setor",
                    "Potencial de mercado e tendências",
                    "Requisitos de acesso ao mercado",
                    "Estruturas de vendas e distribuição",
                    "Diretório de importadores e distribuidores",
                    "Orientações para abordar parceiros",
                    "Recomendações para preparar sua entrada no mercado",
                ] },
            ],
        },
        {
            id: "limites",
            heading: "O que não podemos prometer",
            blocks: [
                { kind: "paragrafo", texto: "O sucesso de um projeto de exportação depende de muitos fatores. Não podemos garantir resposta de todas as empresas nem o fechamento imediato de negócios. Podemos, porém, oferecer uma base sólida para seu planejamento e economizar um tempo considerável na identificação de parceiros comerciais." },
            ],
        },
        {
            id: "confianca",
            heading: "Por que as empresas confiam na EasyProspect",
            blocks: [
                { kind: "cartoes", cartoes: [
                    { titulo: "Orientação prática", texto: "Estudos desenvolvidos para fabricantes, exportadores e profissionais de vendas internacionais." },
                    { titulo: "Muito mais do que listas", texto: "Informações estruturadas e diretórios cuidadosamente pesquisados." },
                    { titulo: "Pesquisa rigorosa", texto: "Metodologia sistemática com revisão manual de qualidade." },
                    { titulo: "Economize tempo", texto: "Comece imediatamente a contatar parceiros potenciais." },
                    { titulo: "Atualizações constantes", texto: "Estudos revisados e ampliados regularmente." },
                    { titulo: "Desenvolvido para seu sucesso", texto: "Base sólida para expandir mercados de forma eficiente." },
                ] },
            ],
        },
        {
            id: "cta",
            heading: "Você já encontrou o mercado-alvo ideal?",
            blocks: [
                { kind: "paragrafo", texto: "Descubra nossos estudos de entrada em mercados e diretórios de importadores para diversos países e setores." },
                { kind: "paragrafo", texto: "Com a EasyProspect, você obtém informações confiáveis de mercado e potenciais parceiros cuidadosamente pesquisados." },
                { kind: "paragrafo", texto: "Escolha agora o estudo de entrada em mercado ideal para o seu negócio." },
            ],
        },
    ],
}

export default aboutPt
