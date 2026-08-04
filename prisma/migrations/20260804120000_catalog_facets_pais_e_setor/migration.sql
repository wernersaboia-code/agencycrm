-- A busca do catálogo passa a ter duas dimensões e só duas: país e setor.
--
-- 1. Setores viram os três que aparecem no título dos estudos de entrada de
--    mercado: exotic_fruits, fmcg, horeca. FMCG deixa de ser dividido entre
--    alimentar e não alimentar — numa lista de país os dois vêm no mesmo
--    arquivo, e a distinção só complicava a busca.
-- 2. Reino Unido passa de "UK" para "GB" (ISO 3166-1), que é o código que o
--    vocabulário de países e o componente de bandeira conhecem.
-- 3. A coluna `category` (importers/exporters/…) é removida: uma mesma lista
--    mistura importadores, distribuidores e atacadistas, então nenhum valor
--    único a descrevia com honestidade.

-- 1a. Frutas exóticas: identificadas pelo título do estudo, já que hoje estão
--     marcadas como fmcg_food.
UPDATE "lead_lists"
SET "industries" = ARRAY['exotic_fruits']
WHERE "name" ILIKE '%exotic fruit%'
   OR "name" ILIKE '%frutas exótica%'
   OR "name" ILIKE '%frutas exotica%'
   OR "name" ILIKE '%exotische früchte%'
   OR "name" ILIKE '%fruits exotiques%'
   OR "name" ILIKE '%frutta esotica%'
   OR "name" ILIKE '%exotisch fruit%';

-- 1b. fmcg_food e fmcg_nonfood colapsam em fmcg, sem duplicar quando a lista
--     tinha os dois.
UPDATE "lead_lists"
SET "industries" = ARRAY(
    SELECT DISTINCT CASE
        WHEN setor IN ('fmcg_food', 'fmcg_nonfood') THEN 'fmcg'
        ELSE setor
    END
    FROM unnest("industries") AS setor
)
WHERE "industries" && ARRAY['fmcg_food', 'fmcg_nonfood'];

-- 1c. Setores do vocabulário antigo que nenhum estudo publicado usa saem do
--     array. Uma lista que ficasse sem setor nenhum some do filtro de setor,
--     então isso é conferido depois da migração.
UPDATE "lead_lists"
SET "industries" = ARRAY(
    SELECT setor
    FROM unnest("industries") AS setor
    WHERE setor IN ('exotic_fruits', 'fmcg', 'horeca')
)
WHERE NOT ("industries" <@ ARRAY['exotic_fruits', 'fmcg', 'horeca']);

-- 2. UK -> GB
UPDATE "lead_lists"
SET "countries" = ARRAY(
    SELECT DISTINCT CASE WHEN pais = 'UK' THEN 'GB' ELSE pais END
    FROM unnest("countries") AS pais
)
WHERE 'UK' = ANY("countries");

-- 3. Remoção da faceta de categoria.
DROP INDEX IF EXISTS "lead_lists_category_idx";
ALTER TABLE "lead_lists" DROP COLUMN "category";
