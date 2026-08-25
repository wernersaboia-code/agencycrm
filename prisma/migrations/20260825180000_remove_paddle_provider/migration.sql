-- Remove o Paddle do banco. As 7 compras de teste que usavam o valor foram
-- apagadas antes desta migration (backup fora do repositorio), entao nada mais
-- referencia 'paddle' nem preenche a coluna.

-- A coluna esta vazia; o indice unico cai junto com ela.
ALTER TABLE "purchases" DROP COLUMN "paddleTransactionId";

-- Postgres nao tem ALTER TYPE ... DROP VALUE: o tipo precisa ser recriado.
-- Conferido antes de escrever isto que o unico dependente do tipo e
-- purchases.provider — sem views, sem policies de RLS —, entao o DROP TYPE
-- no fim nao encontra dependencia pendente.
ALTER TYPE "PaymentProvider" RENAME TO "PaymentProvider_old";

CREATE TYPE "PaymentProvider" AS ENUM ('paypal', 'stripe', 'mercadopago');

-- O default precisa sair antes da troca de tipo e voltar depois: ele e uma
-- expressao tipada no tipo antigo, e o ALTER COLUMN TYPE falha com ele no lugar.
ALTER TABLE "purchases" ALTER COLUMN "provider" DROP DEFAULT;

ALTER TABLE "purchases" ALTER COLUMN "provider" TYPE "PaymentProvider"
  USING ("provider"::text::"PaymentProvider");

ALTER TABLE "purchases" ALTER COLUMN "provider" SET DEFAULT 'paypal';

DROP TYPE "PaymentProvider_old";
