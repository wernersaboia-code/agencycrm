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

### 1. Diagnóstico do acervo inteiro (sem gravar nada)

Baixar os 124 PDFs da loja para uma pasta local e rodar o script em todos. O resultado é uma planilha com uma
linha por estudo: saiu ou falhou, capítulos, páginas, páginas quase vazias e a conferência de texto. Isso diz
quantos estudos o script já resolve e quais formatos ainda quebram, e é o que dimensiona a fase 2.

### 2. Endurecer o script

Problemas já conhecidos:

- **Detector do capítulo 1:** quebra em 3 de 7 na amostra. É o ponto principal.
- **Moldura em português e espanhol** (decisão 2).
- **Marcador de lista U+F0B7** (fonte Symbol do Word): o mesmo caractere que juntava os itens da introdução da
  Sérvia. O site já foi corrigido em `1564ee3`; o script Python precisa da mesma troca.
- **Cartões de empresa:** só são usados quando a primeira coluna do diretório se chama exatamente "Company".
  Diretórios com outro cabeçalho ("Company / Location") viram tabela comum, o que funciona, mas sem o visual dos
  cartões.
- **Endereço de site partido no meio da célula** ("eusmecentrechina.c / n").
- **Conferência de texto embutida:** o script compara o texto do corpo com o original, palavra por palavra e
  descontando cabeçalho, rodapé e sumário, e **recusa gerar** o PDF quando falta texto. Hoje essa conferência
  é feita à mão.

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
