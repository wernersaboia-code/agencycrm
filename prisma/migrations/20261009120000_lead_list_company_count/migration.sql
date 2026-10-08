-- Quantas empresas o diretório do estudo lista. Só para o admin (calibrar
-- preço), nunca aparece no site. Estimado a partir do PDF ou conferido à mão;
-- companyCountManual marca o segundo caso e protege o número da recontagem.
-- Nullable: estudo ainda não contado não tem número, em vez de um zero falso.

ALTER TABLE "lead_lists" ADD COLUMN "companyCount" INTEGER,
ADD COLUMN "companyCountManual" BOOLEAN NOT NULL DEFAULT false;
