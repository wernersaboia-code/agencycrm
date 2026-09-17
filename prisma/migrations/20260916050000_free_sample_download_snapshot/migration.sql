-- Congela o arquivo entregue em cada pedido. A amostra ativa é uma escolha
-- editorial para novos visitantes; ela não pode alterar um link já enviado.
ALTER TABLE "free_sample_downloads"
ADD COLUMN "sampleFilePath" TEXT;
