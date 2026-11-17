-- Versao anterior do PDF do estudo, para o admin poder voltar atras depois de
-- uma troca ou remocao.
ALTER TABLE "lead_lists" ADD COLUMN "studyPdfPreviousUrl" TEXT;
ALTER TABLE "lead_lists" ADD COLUMN "studyPdfPreviousName" TEXT;
ALTER TABLE "lead_lists" ADD COLUMN "studyPdfReplacedAt" TIMESTAMP(3);
