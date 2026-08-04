-- Fecha o acesso público às tabelas via PostgREST.
--
-- A chave anônima do Supabase vai no bundle do navegador
-- (NEXT_PUBLIC_SUPABASE_ANON_KEY), e as roles `anon` e `authenticated` têm
-- SELECT/INSERT/UPDATE/DELETE em todas as tabelas de `public`. Sem RLS, isso
-- deixava o banco inteiro legível e gravável por qualquer visitante do site.
--
-- Nenhuma policy é criada de propósito: com RLS ligado e zero policies, a API
-- pública não enxerga linha nenhuma. A aplicação não é afetada porque o
-- supabase-js só é usado para Auth e Storage — todo acesso a tabela passa pelo
-- Prisma, conectado como `postgres`, que ignora RLS.
--
-- Se algum dia uma tabela precisar ser lida direto pelo cliente, a policy dela
-- deve ser adicionada explicitamente, tabela a tabela.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags_on_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_list_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PurchaseAccessToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BlogPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BlogPostTranslation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BlogCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BlogCategoryTranslation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
