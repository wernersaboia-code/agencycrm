# Modelo visual dos estudos Easy Prospect

## Direção

- Capa A4 clara, título azul-marinho, subtítulo azul, filete amarelo e ilustração arquitetônica em traço de lápis.
- Imagem do país usada como ilustração editorial, sem texto embutido.
- Cabeçalho de marca, filetes e margem lateral discretos nas páginas internas.
- O estudo original continua integralmente após a nova capa, inclusive números de página e links.

## Aplicar a outros estudos

O script [`scripts/padronizar-capas-estudos.py`](../../scripts/padronizar-capas-estudos.py) recebe um PDF existente, os textos que já constam nele e uma ilustração PNG com fundo transparente. Exemplo:

```powershell
& 'C:\Users\werne\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/padronizar-capas-estudos.py `
  'origem.pdf' 'destino_premium.pdf' `
  --title 'Título original do estudo' `
  --subtitle 'Subtítulo original do estudo' `
  --date 'Data original' --country 'País' `
  --illustration 'assets\study-covers\cidade-pencil.png'
```

O script verifica a quantidade de páginas e compara o texto extraído de cada página original com o resultado. A nova capa é visual e não substitui o conteúdo pesquisável. Para uma revisão completa da tipografia e das tabelas internas, será necessário reconstruir o arquivo a partir da fonte editável do estudo; o PDF final não fornece essa estrutura de edição com segurança.
