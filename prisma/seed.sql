BEGIN;

-- Serialize this setup script so concurrent runs cannot create duplicate farms.
LOCK TABLE "public"."Farm" IN SHARE ROW EXCLUSIVE MODE;

DO $$
DECLARE
  selected_farm_id INTEGER;
  farm_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO farm_count FROM "public"."Farm";

  IF farm_count > 1 THEN
    RAISE EXCEPTION 'More than one farm exists. Select a farm explicitly before running setup.';
  ELSIF farm_count = 0 THEN
    INSERT INTO "public"."Farm" ("name", "timezone")
    VALUES ('החווה שלי', 'Asia/Jerusalem')
    RETURNING "id" INTO selected_farm_id;
  ELSE
    SELECT "id" INTO selected_farm_id FROM "public"."Farm";
  END IF;

  INSERT INTO "public"."Arena" ("code", "nameHe", "nameAr", "farmId")
  VALUES
    ('ג', 'מגרש גדול', 'الميدان الكبير', selected_farm_id),
    ('ע', 'מגרש עליון', 'الميدان العلوي', selected_farm_id),
    ('ת', 'מגרש תחתון', 'الميدان السفلي', selected_farm_id),
    ('ר', 'ראונד פיט', 'الميدان الدائري', selected_farm_id)
  ON CONFLICT ("farmId", "code") DO NOTHING;
END $$;

COMMIT;

SELECT f."name" AS farm_name, a."code", a."nameHe", a."nameAr"
FROM "public"."Arena" a
JOIN "public"."Farm" f ON f."id" = a."farmId"
ORDER BY a."id";
