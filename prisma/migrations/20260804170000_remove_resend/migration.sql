-- Remove os resquícios do Resend, que deixou de ser usado.
--
-- `users.resendApiKey` nunca chegou a ser lida por código nenhum, e guardava
-- uma credencial em claro no banco.
--
-- `email_sends.resendId` virou duplicata: o envio é sempre por SMTP, e ali o
-- `id` devolvido pelo nodemailer é o mesmo valor já gravado em `messageId`,
-- que é a coluna usada na detecção de respostas.

ALTER TABLE public.users DROP COLUMN IF EXISTS "resendApiKey";
ALTER TABLE public.email_sends DROP COLUMN IF EXISTS "resendId";
