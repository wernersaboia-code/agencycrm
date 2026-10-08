-- Marca de compra de teste (cartão de teste, lista "Não Comprar").
--
-- Marcada à mão pelo admin na tela de Vendas. Compra marcada fica fora de
-- receita, contagens e ticket médio do painel; o acesso do comprador ao PDF
-- não muda. Nenhuma linha existente é alterada: todas nascem como venda real.

ALTER TABLE "purchases" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;
