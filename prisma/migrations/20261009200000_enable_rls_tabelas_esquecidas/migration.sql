-- Liga RLS nas três tabelas criadas depois de 20260804160000_enable_rls_all_tables
-- que nasceram sem ela.
--
-- O advisor de segurança do Supabase acusou (09/10/2026) `rls_disabled_in_public`
-- em site_texts, google_search_console_connections e industries. As roles
-- `anon` e `authenticated` têm todos os privilégios nelas, e a chave anônima vai
-- no bundle do navegador: qualquer pessoa podia ler, alterar ou apagar textos do
-- site, setores e conexões do Search Console pela API REST do Supabase.
--
-- Sem política nenhuma, RLS nega tudo a anon/authenticated. O app não sente:
-- o Prisma conecta como `postgres`, que ignora RLS — o mesmo regime das outras
-- 29 tabelas.
ALTER TABLE public.site_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_search_console_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
