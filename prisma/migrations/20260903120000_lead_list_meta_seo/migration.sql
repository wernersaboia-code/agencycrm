-- Titulo e descricao de busca por estudo, no idioma do pais.
--
-- `name` e `description` vem da capa do PDF, em ingles, e sao o que o comprador
-- le depois de chegar na pagina. Estes dois sao o que ele le no Google antes de
-- decidir clicar. Separados porque servem a leitores diferentes e porque o
-- vocabulario de busca (importador, distribuidor, setor, pais) nao e o mesmo da
-- capa do estudo.
--
-- Ambos nullable: sem valor, generateMetadata cai em name/description, que e o
-- comportamento anterior. Nenhuma linha existente e alterada por esta migration.

ALTER TABLE "lead_lists" ADD COLUMN "metaTitle" TEXT;
ALTER TABLE "lead_lists" ADD COLUMN "metaDescription" TEXT;
