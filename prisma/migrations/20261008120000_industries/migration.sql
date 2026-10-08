-- Setores do catalogo saem do codigo (lib/constants/catalog-facets.ts) para o
-- banco, para que o admin crie setor novo sem deploy.
--
-- O id e o slug ja gravado em lead_lists.industries e nos links do filtro, por
-- isso os oito setores existentes entram com o MESMO id. Os nomes vem dos
-- arquivos messages/<idioma>.json (catalog.industries), na ordem em que o
-- vocabulario estava no codigo.

CREATE TABLE "industries" (
    "id" TEXT NOT NULL,
    "labels" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

INSERT INTO "industries" ("id", "labels", "sortOrder", "updatedAt") VALUES
    ('exotic_fruits', '{"pt":"Frutas Exóticas","de":"Exotische Früchte","en":"Exotic Fruits","es":"Frutas Exóticas","fr":"Fruits Exotiques","it":"Frutta Esotica","nl":"Exotisch Fruit"}'::jsonb, 10, CURRENT_TIMESTAMP),
    ('fmcg', '{"pt":"FMCG","de":"FMCG","en":"FMCG","es":"FMCG","fr":"FMCG","it":"FMCG","nl":"FMCG"}'::jsonb, 20, CURRENT_TIMESTAMP),
    ('horeca', '{"pt":"HoReCa & Foodservice","de":"HoReCa & Foodservice","en":"HoReCa & Foodservice","es":"HoReCa & Foodservice","fr":"HoReCa & Foodservice","it":"HoReCa & Foodservice","nl":"HoReCa & Foodservice"}'::jsonb, 30, CURRENT_TIMESTAMP),
    ('snacks_bars', '{"pt":"Barras e Snacks","de":"Riegel & Snacks","en":"Bars & Snacks","es":"Barritas y Snacks","fr":"Barres & Snacks","it":"Barrette e Snack","nl":"Repen & Snacks"}'::jsonb, 40, CURRENT_TIMESTAMP),
    ('plant_based_alternatives', '{"pt":"Alternativas Vegetais","de":"Pflanzliche Alternativen","en":"Plant-Based Alternatives","es":"Alternativas Vegetales","fr":"Alternatives Végétales","it":"Alternative Vegetali","nl":"Plantaardige Alternatieven"}'::jsonb, 50, CURRENT_TIMESTAMP),
    ('toys', '{"pt":"Brinquedos","de":"Spielwaren","en":"Toys","es":"Juguetes","fr":"Jouets","it":"Giocattoli","nl":"Speelgoed"}'::jsonb, 60, CURRENT_TIMESTAMP),
    ('baby_toddler_products', '{"pt":"Produtos para Bebês e Crianças Pequenas","de":"Baby- und Kleinkindprodukte","en":"Baby & Toddler Products","es":"Productos para Bebés y Niños Pequeños","fr":"Produits pour Bébés et Tout-Petits","it":"Prodotti per Neonati e Bambini Piccoli","nl":"Baby- en Peuterproducten"}'::jsonb, 70, CURRENT_TIMESTAMP),
    ('granular_sulphur', '{"pt":"Enxofre Granulado","de":"Granulierter Schwefel","en":"Granular Sulphur","es":"Azufre Granulado","fr":"Soufre Granulé","it":"Zolfo Granulare","nl":"Gegranuleerde Zwavel"}'::jsonb, 80, CURRENT_TIMESTAMP);
