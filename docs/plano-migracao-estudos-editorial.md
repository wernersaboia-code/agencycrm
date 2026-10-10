# Plano: levar todos os estudos para o modelo editorial

Escrito em 10/10/2026. O modelo é o dos dois pilotos aprovados em 09/10 (Áustria/bebês e enxofre/Alemanha),
gerado por [`scripts/redesign-market-study.py`](../scripts/redesign-market-study.py): A4 retrato, menu lateral
de capítulos, sumário gerado, cartões de empresas e negrito preservado.

## Onde estamos

**O acervo:** 124 estudos ativos com PDF, em 67 países.

| Setor | Estudos | Idioma |
|---|---|---|
| HoReCa / foodservice | 64 | inglês |
| FMCG | 25 | inglês |
| Bebês e primeira infância | 21 | inglês |
| Brinquedos | 8 | inglês |
| Avulsos (frutas exóticas, enxofre, barras, plant-based) | 6 | inglês, português, espanhol |

**Teste de hoje:** rodei o script, sem mexer em nada, em 7 PDFs da loja de formatos diferentes.

| Estudo | Resultado |
|---|---|
| Bebês Áustria (piloto) | ok: 10 capítulos, 26 páginas |
| Bebês China | ok: 9 capítulos, 28 páginas |
| FMCG Luxemburgo (sumário sem pontilhado) | ok: 13 capítulos, 33 páginas |
| HoReCa Sérvia | ok: 7 capítulos, 21 páginas |
| FMCG Noruega | **falha**: não acha o capítulo 1 |
| Frutas exóticas, em português | **falha**: não acha o capítulo 1 |
| Brinquedos Alemanha | **falha**: não acha o capítulo 1 |

Nos 4 que saíram, o texto do corpo bate com o original. O que não aparece no PDF novo é o cabeçalho e o rodapé
repetidos ("Market Entry Study … | Page N") e o sumário antigo, que o modelo substitui de propósito. A conta,
porém, foi feita por contagem de palavras, que é grosseira. A conferência de verdade fica para a fase 2.

### Resultado das fases 1 e 2 (10/10)

**Fase 1, diagnóstico dos 124:** o script original gerava 101 e quebrava em 23. Entre os que geravam, 3 perdiam
texto de verdade:

| Problema | Estudos | Causa |
|---|---|---|
| Não acha a capa | 17 | Procurava "MARKET ENTRY STUDY" escrito igual; há "MARKET ENTRY S TUDY", "MA R K E T…", "MARKET-ENTRY GUIDE", português, espanhol e capa sem rótulo |
| Não acha o capítulo 1 | 3 | Título de capítulo em 14 ou 16 pt (o script exigia 15), "1 Executive summary" sem ponto, capítulo 1 na própria capa |
| Quebra ao montar | 3 | Linha de tabela mais alta que uma página |
| Cartões perdiam colunas | Noruega e França (bebês) | Supunham 4 colunas em ordem fixa; Noruega tem 7, França 5, e em França tipo e perfil trocavam de lugar |
| Tabela "campo / valor" sem os valores | Emirados (FMCG) | A tabela só é detectada pela coluna da esquerda; o texto da direita não entrava em lugar nenhum. Um quarto do diretório sumia |
| Resumo executivo sem número sumia | Suíça (HoReCa), Itália (FMCG), Omã | O script começava no "1." e descartava o "Executive Summary" que vem antes |
| Rodapé dentro do diretório | Índia (bebês) | Páginas em paisagem, onde o rodapé fica a 549 pt e não a 790 |

**Fase 2, script endurecido:** os **124 estudos geram**, e a conferência embutida encontra no máximo 0,6% de
palavras do original ausentes (mediana 0,0%). O que resta é endereço de site partido em célula estreita e um
rodapé fora da zona padrão em Portugal, não conteúdo. O que mudou:

- capa lida pela estrutura (rótulo reconhecido pelo texto, título no maior corpo, subtítulo, escopo, data);
- tamanho do título de capítulo medido em cada estudo, e o corpo começa no primeiro título de capítulo depois do
  sumário de origem, com ou sem número;
- cabeçalho e rodapé de origem reconhecidos por repetição na borda da página, em retrato e em paisagem;
- cartões de empresa guiados pelo cabeçalho: nada é descartado, cada coluna vai com o próprio rótulo; matrizes
  sem coluna de contato continuam tabela;
- linha de tabela maior que uma página vira parágrafos rotulados;
- lista numerada no texto mantém um item por parágrafo;
- moldura em português e espanhol (`--lang pt|es`);
- marcador U+F0B7 vira `•`;
- **conferência de texto embutida:** se faltar mais de 1% das palavras do original, o PDF sai como
  `*.rejeitado.pdf` e o script termina com erro.

O piloto da Áustria continua com a mesma cara.

**O que já está resolvido fora deste plano:** as introduções e as descrições da página de cada estudo ficam no
banco, não no PDF. As 8 introduções que mostravam o sumário foram trocadas pelo resumo executivo em 10/10, e as
124 descrições novas foram gravadas no mesmo dia. Trocar o PDF não muda nenhum desses textos.

## Decisões que são suas (antes de tudo)

1. **Ilustração da capa.** Hoje existem 2 (`berlin-pencil.png`, `vienna-pencil.png`) e são 67 países. Opções:
   - uma ilustração por país (67 imagens; é o que os pilotos fazem);
   - uma por região (cerca de 8: Europa Central, Nórdicos, Ibéria, Golfo, Sudeste Asiático, América Latina…);
   - uma por setor (5), sem país.

   A escolha define o prazo. As outras fases não dependem dela.
2. **Idioma da moldura.** O script escreve "MARKET ENTRY STUDY" e "Table of Contents" fixos em inglês. As duas
   edições em português e espanhol precisam da moldura no idioma delas. A proposta é traduzir a moldura e manter
   o texto do estudo como está.
3. **Os PDFs novos substituem os da loja?** Os pilotos ainda não substituem. Como não há venda real (as 5
   compras são de teste), a troca não afeta nenhum cliente.

## Fases

### 1. Diagnóstico do acervo inteiro: feito em 10/10

### 2. Endurecer o script: feito em 10/10

Resultado na seção "Onde estamos". Para gerar um estudo:

```powershell
python scripts/redesign-market-study.py origem.pdf destino.pdf --illustration assets/study-covers/vienna-pencil.png --country Austria
```

`--lang pt` ou `--lang es` para as edições em português e espanhol. Saída com status 2 quer dizer que a
conferência de texto recusou o arquivo.

### 3. O que o site lê de dentro do PDF

Quatro funções do site leem o PDF pela geometria do modelo atual. Cada uma precisa ser testada com um PDF
novo antes da troca:

| Função | Arquivo | Risco com o modelo novo |
|---|---|---|
| Validação de contato pessoal no upload | `lib/marketplace/pdf-contatos.ts` | Cartões mudam a disposição do e-mail e do telefone |
| Contagem de empresas (admin) | `lib/marketplace/contagem-empresas.ts` | Procura o capítulo do diretório pelo título; deve funcionar, mas é preciso conferir |
| Botão "importar resumo do PDF" (admin) | `lib/marketplace/resumo-do-estudo.ts` | Mede corpo de 10,5 pt e títulos de 15 pt; o modelo novo usa outros tamanhos |
| Imagens da vitrine da home | `scripts/gerar-imagens-estudo.py` | O borrão da coluna de contato se guia pela tabela, que vira cartões |

Nenhuma delas afeta o que já está no ar. Elas só agem quando um PDF novo sobe ou quando alguém usa o botão.

### 4. Ilustrações

Conforme a decisão 1. Fundo transparente, traço de lápis, sem texto embutido, como as duas que já existem.

### 5. Revisão por lote

Um setor por vez, do menor para o maior: avulsos (6), brinquedos (8), bebês (21), FMCG (25) e HoReCa (64).
Em cada lote eu gero todos os PDFs e passo na conferência automática, e você aprova uma amostra de 3 antes de
publicar o lote.

### 6. Publicação

- Guardar os PDFs atuais da loja (backup) antes de trocar.
- Subir pelo mesmo caminho do admin, para o PDF passar pela validação de contatos.
- Conferir em produção: download depois da compra de teste, amostra gratuita e nome do arquivo baixado.
- Um setor por vez, para que um problema fique restrito a um lote.

## Ordem sugerida

Fases 1 e 2 primeiro, porque dependem só do código. Elas podem andar enquanto a decisão das ilustrações não
sai. A fase 3 vem junto da 2. As fases 4, 5 e 6 dependem das suas decisões.
