# Migração para VPS Hetzner — próximo passo de infraestrutura

> **Status: planejado, não iniciado.** Documento vivo da frente de infraestrutura.
> Levantamento feito em 2026-10-21 na VPS `production-01` (2.29.42.104), acesso por
> `ssh -i ~/.ssh/foodie_vps deploy@2.29.42.104`.

## Por que

Hoje o `agencycrm` depende da Vercel. A conta funciona, mas o deploy só é validado
no push para `main` (o `buildCommand` do `vercel.json` roda testes, lint e
`prisma migrate deploy`), previews também rodam migração no banco de produção, e a
VPS já tem a base de operação (Caddy, monitoramento, backups, pipeline de deploy)
que a Vercel cobra por fora. O app é stateless — banco e arquivos no Supabase —
então cabe na VPS sem mover dados.

## Inventário da VPS (2026-10-21)

| Item | Valor |
|---|---|
| Provedor / OS | Hetzner / Ubuntu 24.04.5 LTS, kernel 6.8 |
| CPU / RAM | 2 vCPU / 3,7 GiB (swap 2 GiB, ~490 MiB usados) |
| Disco | 38 GB, 19 GB usados, **18 GB livres** (+ ~11 GB recuperáveis no Docker) |
| Load | 0,22 — folga confortável |
| Edge | Caddy 2 em container (`~/edge`), portas 80/443, TLS automático |
| Projetos | Foodie staging (Java + MariaDB) e Storyverse (Java + Postgres + web) |
| Monitoramento | Prometheus + Alertmanager + blackbox exporter |
| Backups | systemd timers para R2 (`foodie-backup-r2`, `storyverse-backup-r2`) |
| Deploy | `~/deploy-ci.sh`, `~/ci-incoming/`, `~/releases/`, `.deployed` |
| Segurança | `fail2ban`, unattended-upgrades, acesso por chave (`deploy`) |

Espaço em disco é o recurso mais apertado. Antes de começar:
`docker builder prune` e limpar `~/platform-release-*.tar` / `~/releases` antigos.

## Arquitetura alvo

```
Internet
  │
  ▼
Caddy (edge, TLS)  ──►  agencycrm-web (Next 16 standalone, porta interna 3000)
                          │
                          ├── Supabase (Postgres + Auth + Storage)  [externo]
                          └── Sentry / analytics                     [externo]
```

- Imagem construída **no GitHub Actions** e publicada no GHCR — nunca `next build`
  na VPS (pico de 1,5–2 GB competiria com Foodie/Storyverse). Storyverse já usa GHCR,
  então o padrão existe.
- Container sem estado: `output: "standalone"`, healthcheck em `/api/health`,
  `mem_limit` explícito, restart `unless-stopped`.
- Caddy ganha um bloco para o domínio do `agencycrm` na rede do container.

## Fases

### Fase 0 — Preparação (sem tocar em produção)

1. `next.config.ts`: `output: "standalone"`.
2. `Dockerfile` multi-stage (deps → build → runner) + `sharp` para `next/image`.
3. `docker-compose.yml` do app (env via `.env`, healthcheck, mem_limit).
4. Bloco no `Caddyfile` apontando para o container (domínio de staging via sslip.io
   primeiro, como os outros projetos).
5. Limpeza de disco e conferência de folga.

### Fase 1 — Deploy paralelo (staging)

6. Workflow do GitHub Actions: test → build imagem → push GHCR → chamar
   `deploy-ci.sh` (ou script equivalente) por SSH.
7. Migrações do Prisma rodam **como passo do pipeline**, antes do swap do container,
   com `DIRECT_URL`. Isso resolve a decisão pendente da Vercel: fora do `next build`.
8. Smoke test: `/`, `/blog`, `/blog?page=2`, `/catalog`, `/list/<slug>`, `/api/health`.

### Fase 2 — Adaptações de plataforma

9. **Crons** (`vercel.json`): dois systemd timers chamando
   `/api/cron/detect-replies` e `/api/cron/process-sequences` com
   `Authorization: Bearer $CRON_SECRET`. Mesmo padrão dos backups.
10. **Geo da moeda** (`proxy.ts:181`): `x-vercel-ip-country` não existe na VPS.
    Opções: Cloudflare na frente (`cf-ipcountry`), GeoIP no Caddy, ou aceitar o
    fallback por idioma (hoje o palpite já cai para BRL no locale padrão).
11. **Analytics**: `@vercel/analytics`, `@vercel/speed-insights` e a página
    `/super-admin/web-analytics` param de coletar fora da Vercel. Trocar por
    Umami/Plausible (self-host) ou manter a Vercel só como leitura histórica.
12. **Proxy/idioma**: conferir `NEXT_LOCALE`, Caddy preservando query string e
    `x-forwarded-*` (o `proxy.ts` usa IP e protocolo).

### Fase 3 — Corte

13. Apontar o domínio de produção para a VPS (janela de baixo tráfego).
14. Rodar o checklist de verificação (`curl` das rotas, checkout de teste,
    webhooks de pagamento, envio de e-mail, download do estudo).
15. Manter a Vercel por 1–2 semanas como rollback (DNS com TTL baixo).
16. Desligar a Vercel e remover variáveis órfãs.

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Build na VPS estoura RAM | build no CI; se local, `--max-old-space-size` + swap e sem concorrência |
| Disco cheio | prune antes; política de retenção de releases/imagens/logs |
| Migração falha no meio do deploy | `prisma migrate deploy` no pipeline, migrações expand/contract, tag anterior para rollback |
| Webhooks de pagamento apontando para o domínio antigo | reconfigurar MP/Stripe antes do corte; testar com compra real |
| Analytics da Vercel some | decidir substituto na Fase 2 |
| Container reinicia sem subir | healthcheck + `restart: unless-stopped` + monitor blackbox |
| Root password exposta em chat | trocar senha e desabilitar `PasswordAuthentication` (só chave) |

## Definição de pronto

- [ ] Pipeline builda e publica imagem no GHCR a cada push em `main`.
- [ ] `deploy-ci.sh` da VPS troca o container com healthcheck e rollback.
- [ ] Migrações rodam no pipeline, fora do build da aplicação.
- [ ] Os dois crons rodam por timer com sucesso por 7 dias.
- [ ] Monitoramento (blackbox) e alerta para o novo domínio.
- [ ] Domínio de produção na VPS; Vercel desligada após a janela de rollback.
- [ ] Rodapé/canais internos sem referência à Vercel.
