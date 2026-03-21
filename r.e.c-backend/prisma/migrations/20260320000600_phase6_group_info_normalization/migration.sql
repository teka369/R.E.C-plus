-- Fase 6: Normalización de GroupInfo (JSON → tablas hijas)
-- Las columnas highlights, metrics y links Json se mantienen como legadas
-- Se crean tablas GroupInfoHighlight, GroupInfoMetric, GroupInfoLink

-- 1. Tabla GroupInfoHighlight
CREATE TABLE "GroupInfoHighlight" (
    "id"        SERIAL PRIMARY KEY,
    "groupId"   INTEGER NOT NULL,
    "texto"     TEXT NOT NULL,
    "orden"     INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "GroupInfoHighlight"
  ADD CONSTRAINT "GroupInfoHighlight_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "GroupInfo"("groupId")
  ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "GroupInfoHighlight_groupId_idx" ON "GroupInfoHighlight"("groupId");

-- 2. Tabla GroupInfoMetric
CREATE TABLE "GroupInfoMetric" (
    "id"        SERIAL PRIMARY KEY,
    "groupId"   INTEGER NOT NULL,
    "etiqueta"  TEXT NOT NULL,
    "valor"     TEXT NOT NULL,
    "orden"     INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "GroupInfoMetric"
  ADD CONSTRAINT "GroupInfoMetric_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "GroupInfo"("groupId")
  ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "GroupInfoMetric_groupId_idx" ON "GroupInfoMetric"("groupId");

-- 3. Tabla GroupInfoLink
CREATE TABLE "GroupInfoLink" (
    "id"        SERIAL PRIMARY KEY,
    "groupId"   INTEGER NOT NULL,
    "titulo"    TEXT NOT NULL,
    "url"       TEXT NOT NULL,
    "orden"     INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "GroupInfoLink"
  ADD CONSTRAINT "GroupInfoLink_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "GroupInfo"("groupId")
  ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "GroupInfoLink_groupId_idx" ON "GroupInfoLink"("groupId");

-- 4. Migrar datos JSON existentes a tablas hijas

-- highlights: se espera array de strings: ["texto1", "texto2"]
INSERT INTO "GroupInfoHighlight" ("groupId", "texto", "orden")
SELECT
    gi."groupId",
    item.value::text,
    (row_number() OVER (PARTITION BY gi."groupId" ORDER BY item.ordinality) - 1)
FROM "GroupInfo" gi
CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE
        WHEN gi."highlights" IS NOT NULL
             AND jsonb_typeof(gi."highlights"::jsonb) = 'array'
        THEN gi."highlights"::jsonb
        ELSE '[]'::jsonb
    END
) WITH ORDINALITY AS item(value, ordinality)
WHERE gi."highlights" IS NOT NULL;

-- metrics: se espera array de objetos: [{"label":"...", "value":"..."}]
INSERT INTO "GroupInfoMetric" ("groupId", "etiqueta", "valor", "orden")
SELECT
    gi."groupId",
    COALESCE(item.obj->>'label', item.obj->>'etiqueta', 'Métrica'),
    COALESCE(item.obj->>'value', item.obj->>'valor', ''),
    (row_number() OVER (PARTITION BY gi."groupId" ORDER BY item.ordinality) - 1)
FROM "GroupInfo" gi
CROSS JOIN LATERAL jsonb_array_elements(
    CASE
        WHEN gi."metrics" IS NOT NULL
             AND jsonb_typeof(gi."metrics"::jsonb) = 'array'
        THEN gi."metrics"::jsonb
        ELSE '[]'::jsonb
    END
) WITH ORDINALITY AS item(obj, ordinality)
WHERE gi."metrics" IS NOT NULL
  AND (item.obj->>'label' IS NOT NULL OR item.obj->>'etiqueta' IS NOT NULL);

-- links: se espera array de objetos: [{"titulo":"...", "url":"..."}] o [{"title":"...", "url":"..."}]
INSERT INTO "GroupInfoLink" ("groupId", "titulo", "url", "orden")
SELECT
    gi."groupId",
    COALESCE(item.obj->>'titulo', item.obj->>'title', 'Enlace'),
    item.obj->>'url',
    (row_number() OVER (PARTITION BY gi."groupId" ORDER BY item.ordinality) - 1)
FROM "GroupInfo" gi
CROSS JOIN LATERAL jsonb_array_elements(
    CASE
        WHEN gi."links" IS NOT NULL
             AND jsonb_typeof(gi."links"::jsonb) = 'array'
        THEN gi."links"::jsonb
        ELSE '[]'::jsonb
    END
) WITH ORDINALITY AS item(obj, ordinality)
WHERE gi."links" IS NOT NULL
  AND item.obj->>'url' IS NOT NULL;
