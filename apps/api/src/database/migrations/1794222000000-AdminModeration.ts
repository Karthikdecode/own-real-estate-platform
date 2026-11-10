import type { MigrationInterface, QueryRunner } from 'typeorm';
import { hashPassword } from '../../modules/auth/password.js';

export class AdminModeration1794222000000 implements MigrationInterface {
  name = 'AdminModeration1794222000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Master Data Table (Dictionary lookup pattern)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "master_data" (
        "id" BIGSERIAL NOT NULL,
        "domain" varchar(100) NOT NULL,
        "key" varchar(100) NOT NULL,
        "value" varchar(255) NOT NULL,
        "description" text,
        "sort_order" smallint NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at" timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT "pk_master_data" PRIMARY KEY ("id"),
        CONSTRAINT "uq_master_data_domain_key" UNIQUE ("domain", "key")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_master_data_domain_active" 
      ON "master_data" ("domain", "sort_order") 
      WHERE "is_active" = true
    `);

    // Seed Core Master Data
    await queryRunner.query(`
      INSERT INTO "master_data" ("domain", "key", "value", "description", "sort_order") VALUES
      ('PROPERTY_STATUS', 'DRAFT', 'Draft', 'Listing is private and draft', 1),
      ('PROPERTY_STATUS', 'PENDING_REVIEW', 'Pending Review', 'Awaiting administrative moderation', 2),
      ('PROPERTY_STATUS', 'PUBLISHED', 'Published', 'Live on public marketplace', 3),
      ('PROPERTY_STATUS', 'CHANGES_REQUESTED', 'Changes Requested', 'Admin requested owner revisions', 4),
      ('PROPERTY_STATUS', 'REJECTED', 'Rejected', 'Rejected by moderator', 5),
      ('PROPERTY_STATUS', 'UNPUBLISHED', 'Unpublished', 'Deactivated listing', 6),
      ('USER_ROLE', 'USER', 'Standard User', 'Marketplace customer and property owner', 1),
      ('USER_ROLE', 'MODERATOR', 'Listing Moderator', 'Reviews and moderates properties', 2),
      ('USER_ROLE', 'ADMIN', 'Administrator', 'Full system management', 3)
      ON CONFLICT ("domain", "key") DO NOTHING
    `);

    // 2. Roles Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" varchar(50) NOT NULL,
        "name" varchar(100) NOT NULL,
        "description" text,
        "is_system" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at" timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT "pk_roles" PRIMARY KEY ("id"),
        CONSTRAINT "uq_roles_code" UNIQUE ("code")
      )
    `);

    // 3. Permissions Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" varchar(100) NOT NULL,
        "name" varchar(150) NOT NULL,
        "module" varchar(50) NOT NULL,
        "description" text,
        "created_at" timestamptz(3) NOT NULL DEFAULT now(),
        "updated_at" timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT "pk_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "uq_permissions_code" UNIQUE ("code")
      )
    `);

    // 4. User Roles Mapping
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_roles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "assigned_at" timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT "pk_user_roles" PRIMARY KEY ("id"),
        CONSTRAINT "uq_user_roles" UNIQUE ("user_id", "role_id"),
        CONSTRAINT "fk_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_roles_role" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE
      )
    `);

    // 5. Role Permissions Mapping
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        "created_at" timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT "pk_role_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "uq_role_permissions" UNIQUE ("role_id", "permission_id"),
        CONSTRAINT "fk_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE
      )
    `);

    // 6. Property Status History (Lifecycle Audit Trail)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "property_status_history" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "property_id" uuid NOT NULL,
        "old_status" varchar(50) NOT NULL,
        "new_status" varchar(50) NOT NULL,
        "changed_by" uuid NOT NULL,
        "remarks" text,
        "created_at" timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT "pk_property_status_history" PRIMARY KEY ("id"),
        CONSTRAINT "fk_property_status_history_property" FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_property_status_history_user" FOREIGN KEY ("changed_by") REFERENCES "users" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_property_status_history_prop" 
      ON "property_status_history" ("property_id", "created_at" DESC)
    `);

    // 7. Admin Audit Logs (Tamper-Resistant Administrative Operations)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "actor_user_id" uuid NOT NULL,
        "action" varchar(100) NOT NULL,
        "entity_type" varchar(50) NOT NULL,
        "entity_id" uuid NOT NULL,
        "old_values" jsonb,
        "new_values" jsonb,
        "ip_address" varchar(45),
        "created_at" timestamptz(3) NOT NULL DEFAULT now(),
        CONSTRAINT "pk_admin_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "fk_admin_audit_logs_actor" FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_admin_audit_logs_actor" 
      ON "admin_audit_logs" ("actor_user_id", "created_at" DESC)
    `);

    // 8. Seed Roles & Permissions
    await queryRunner.query(`
      INSERT INTO "roles" ("code", "name", "description", "is_system") VALUES
      ('USER', 'Standard User', 'Marketplace customer and property owner', true),
      ('MODERATOR', 'Listing Moderator', 'Reviews and moderates property listings', true),
      ('ADMIN', 'Platform Administrator', 'Full control over platform listings and management', true)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("code", "name", "module", "description") VALUES
      ('property.create', 'Create Property', 'properties', 'Post new property listing'),
      ('property.update.own', 'Update Own Property', 'properties', 'Edit own properties'),
      ('property.view.all', 'View All Properties', 'properties', 'View draft and unpublished listings'),
      ('property.approve', 'Approve Property', 'moderation', 'Approve listing for public search'),
      ('property.reject', 'Reject Property', 'moderation', 'Reject property listing with reasons'),
      ('admin.dashboard.view', 'View Admin Dashboard', 'admin', 'Access admin KPI overview')
      ON CONFLICT ("code") DO NOTHING
    `);

    // Map permissions to ADMIN
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id FROM "roles" r CROSS JOIN "permissions" p
      WHERE r.code = 'ADMIN'
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    // Map permissions to MODERATOR
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id FROM "roles" r CROSS JOIN "permissions" p
      WHERE r.code = 'MODERATOR' AND p.code IN ('property.view.all', 'property.approve', 'property.reject', 'admin.dashboard.view')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    // 9. Seed Demo Admin User if not already present
    const adminPasswordHash = hashPassword('Password123!');
    const existingAdmin = await queryRunner.query(`SELECT id FROM "users" WHERE email = 'admin@realestate.com'`);
    let adminId: string;
    if (existingAdmin.length === 0) {
      const inserted = await queryRunner.query(`
        INSERT INTO "users" ("full_name", "email", "mobile_number", "password_hash", "role", "is_verified")
        VALUES ('System Administrator', 'admin@realestate.com', '+919876543299', '${adminPasswordHash}', 'admin', true)
        RETURNING id
      `);
      adminId = inserted[0].id;
    } else {
      adminId = existingAdmin[0].id;
      await queryRunner.query(`UPDATE "users" SET "role" = 'admin' WHERE id = '${adminId}'`);
    }

    // Attach admin role in user_roles
    await queryRunner.query(`
      INSERT INTO "user_roles" ("user_id", "role_id")
      SELECT '${adminId}', id FROM "roles" WHERE code = 'ADMIN'
      ON CONFLICT ("user_id", "role_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "property_status_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "master_data"`);
  }
}
