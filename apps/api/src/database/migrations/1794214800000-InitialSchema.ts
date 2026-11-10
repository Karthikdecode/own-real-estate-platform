import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema, written by hand so the partial, expression and trigram indexes are explicit.
 * Constraint and index names match the entity metadata, so `migration:generate` against a freshly
 * migrated database reports no changes. All timestamps are timestamptz(3) (millisecond precision
 * round-trips through JS Dates, keeping keyset cursors exact).
 */
export class InitialSchema1794214800000 implements MigrationInterface {
  name = 'InitialSchema1794214800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    await queryRunner.query(`CREATE TYPE "user_role" AS ENUM ('user', 'admin')`);
    await queryRunner.query(
      `CREATE TYPE "property_type" AS ENUM ('apartment', 'independent_house', 'villa', 'builder_floor', 'plot', 'commercial')`,
    );
    await queryRunner.query(`CREATE TYPE "listing_type" AS ENUM ('sale', 'rent')`);
    await queryRunner.query(
      `CREATE TYPE "property_status" AS ENUM ('draft', 'published', 'unpublished')`,
    );
    await queryRunner.query(`CREATE TYPE "inquiry_status" AS ENUM ('new', 'contacted', 'closed')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "full_name" varchar(100) NOT NULL,
        "email" varchar(254) NOT NULL,
        "mobile_number" varchar(16),
        "password_hash" varchar(255) NOT NULL,
        "role" "user_role" NOT NULL DEFAULT 'user',
        "is_verified" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at" timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT "pk_users" PRIMARY KEY ("id"),
        CONSTRAINT "uq_users_email" UNIQUE ("email"),
        CONSTRAINT "uq_users_mobile_number" UNIQUE ("mobile_number"),
        CONSTRAINT "chk_users_email_lowercase" CHECK ("email" = lower("email"))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "family_id" uuid NOT NULL,
        "token_hash" char(64) NOT NULL,
        "expires_at" timestamptz(3) NOT NULL,
        "revoked_at" timestamptz(3),
        "created_at" timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT "pk_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "uq_refresh_tokens_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "fk_refresh_tokens_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_family_id" ON "refresh_tokens" ("family_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "properties" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_id" uuid NOT NULL,
        "title" varchar(150) NOT NULL,
        "slug" varchar(200) NOT NULL,
        "description" text NOT NULL,
        "property_type" "property_type" NOT NULL,
        "listing_type" "listing_type" NOT NULL,
        "price" bigint NOT NULL,
        "city" varchar(100) NOT NULL,
        "locality" varchar(150) NOT NULL,
        "address" varchar(300) NOT NULL,
        "pincode" varchar(6) NOT NULL,
        "latitude" numeric(9,6),
        "longitude" numeric(9,6),
        "bedrooms" smallint,
        "bathrooms" smallint,
        "area_sqft" integer NOT NULL,
        "status" "property_status" NOT NULL DEFAULT 'draft',
        "published_at" timestamptz(3),
        "created_at" timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at" timestamptz(3) NOT NULL DEFAULT now(),
        "deleted_at" timestamptz(3),
        CONSTRAINT "pk_properties" PRIMARY KEY ("id"),
        CONSTRAINT "uq_properties_slug" UNIQUE ("slug"),
        CONSTRAINT "fk_properties_owner" FOREIGN KEY ("owner_id")
          REFERENCES "users" ("id") ON DELETE RESTRICT,
        CONSTRAINT "chk_properties_price_positive" CHECK ("price" > 0),
        CONSTRAINT "chk_properties_area_positive" CHECK ("area_sqft" > 0),
        CONSTRAINT "chk_properties_bedrooms_range"
          CHECK ("bedrooms" IS NULL OR "bedrooms" BETWEEN 0 AND 20),
        CONSTRAINT "chk_properties_bathrooms_range"
          CHECK ("bathrooms" IS NULL OR "bathrooms" BETWEEN 0 AND 20),
        CONSTRAINT "chk_properties_pincode_format" CHECK ("pincode" ~ '^[1-9][0-9]{5}$'),
        CONSTRAINT "chk_properties_coordinates_pair"
          CHECK (("latitude" IS NULL) = ("longitude" IS NULL)),
        CONSTRAINT "chk_properties_latitude_range"
          CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90),
        CONSTRAINT "chk_properties_longitude_range"
          CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180),
        CONSTRAINT "chk_properties_published_at"
          CHECK ("status" <> 'published' OR "published_at" IS NOT NULL)
      )
    `);
    // Owner dashboard keyset and owner foreign-key lookups.
    await queryRunner.query(`
      CREATE INDEX "idx_properties_owner_created" ON "properties" ("owner_id", "created_at", "id")
      WHERE "deleted_at" IS NULL
    `);
    // Public search without a city: newest/oldest.
    await queryRunner.query(`
      CREATE INDEX "idx_properties_public_listing_published"
      ON "properties" ("listing_type", "published_at", "id")
      WHERE "status" = 'published' AND "deleted_at" IS NULL
    `);
    // Public search without a city: price sort and budget range.
    await queryRunner.query(`
      CREATE INDEX "idx_properties_public_listing_price"
      ON "properties" ("listing_type", "price", "id")
      WHERE "status" = 'published' AND "deleted_at" IS NULL
    `);
    // City search: newest/oldest.
    await queryRunner.query(`
      CREATE INDEX "idx_properties_public_city_published"
      ON "properties" (lower("city"), "listing_type", "published_at", "id")
      WHERE "status" = 'published' AND "deleted_at" IS NULL
    `);
    // City search: price sort, budget range and similar-property candidates.
    await queryRunner.query(`
      CREATE INDEX "idx_properties_public_city_price"
      ON "properties" (lower("city"), "listing_type", "price", "id")
      WHERE "status" = 'published' AND "deleted_at" IS NULL
    `);
    // Location search: ILIKE '%text%' must use this exact expression to hit the trigram index.
    await queryRunner.query(`
      CREATE INDEX "idx_properties_public_location_trgm" ON "properties"
      USING gin (("locality" || ' ' || "city" || ' ' || "pincode") gin_trgm_ops)
      WHERE "status" = 'published' AND "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "property_images" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "property_id" uuid NOT NULL,
        "storage_key" varchar(255) NOT NULL,
        "mime_type" varchar(50) NOT NULL,
        "size_bytes" integer NOT NULL,
        "display_order" smallint NOT NULL DEFAULT 0,
        "is_primary" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT "pk_property_images" PRIMARY KEY ("id"),
        CONSTRAINT "uq_property_images_storage_key" UNIQUE ("storage_key"),
        CONSTRAINT "fk_property_images_property" FOREIGN KEY ("property_id")
          REFERENCES "properties" ("id") ON DELETE CASCADE,
        CONSTRAINT "chk_property_images_size_positive" CHECK ("size_bytes" > 0),
        CONSTRAINT "chk_property_images_display_order" CHECK ("display_order" >= 0),
        CONSTRAINT "chk_property_images_mime_type"
          CHECK ("mime_type" IN ('image/jpeg', 'image/png', 'image/webp'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_property_images_property_order"
      ON "property_images" ("property_id", "display_order")
    `);
    // At most one cover image per property.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_property_images_primary" ON "property_images" ("property_id")
      WHERE "is_primary"
    `);

    await queryRunner.query(`
      CREATE TABLE "inquiries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "property_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "owner_id" uuid NOT NULL,
        "message" varchar(1000) NOT NULL,
        "status" "inquiry_status" NOT NULL DEFAULT 'new',
        "created_at" timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at" timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT "pk_inquiries" PRIMARY KEY ("id"),
        CONSTRAINT "fk_inquiries_property" FOREIGN KEY ("property_id")
          REFERENCES "properties" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_inquiries_sender" FOREIGN KEY ("sender_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_inquiries_owner" FOREIGN KEY ("owner_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "chk_inquiries_not_self" CHECK ("sender_id" <> "owner_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_inquiries_owner_created" ON "inquiries" ("owner_id", "created_at", "id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_inquiries_sender_created" ON "inquiries" ("sender_id", "created_at")
    `);
    await queryRunner.query(`CREATE INDEX "idx_inquiries_property" ON "inquiries" ("property_id")`);
    // One open inquiry per sender and property, enforced even under concurrent requests.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_inquiries_open_per_sender" ON "inquiries" ("property_id", "sender_id")
      WHERE "status" IN ('new', 'contacted')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "inquiries"`);
    await queryRunner.query(`DROP TABLE "property_images"`);
    await queryRunner.query(`DROP TABLE "properties"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "inquiry_status"`);
    await queryRunner.query(`DROP TYPE "property_status"`);
    await queryRunner.query(`DROP TYPE "listing_type"`);
    await queryRunner.query(`DROP TYPE "property_type"`);
    await queryRunner.query(`DROP TYPE "user_role"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS pg_trgm`);
  }
}
