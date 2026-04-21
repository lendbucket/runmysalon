-- RunMySalon Tenant Backfill Migration (post db-push)
-- Ensures all existing rows point to the default Salon Envy tenant

-- Step 1: Upsert the default Salon Envy tenant
INSERT INTO "tenants" ("id", "slug", "name", "status", "ownerEmail", "timezone", "currency", "locale", "country", "createdAt", "updatedAt")
VALUES ('clsalonenvy000000000000000', 'salonenvy', 'Salon Envy USA', 'ACTIVE', 'ceo@36west.org', 'America/Chicago', 'USD', 'en-US', 'US', NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET "name" = 'Salon Envy USA';

-- Step 2: Backfill all rows with NULL tenantId
UPDATE "users" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "locations" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "staff_members" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "inventory_items" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "schedules" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "shifts" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "admin_alerts" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "purchase_orders" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "conduct_records" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "onboarding_enrollments" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "clients" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "client_formulas" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "card_on_file_requests" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "appointment_notes" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "financial_accounts" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "expenses" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "invoices" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "booth_rentals" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "tax_records" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "contractor_payments" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "business_models" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "offboarding_records" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "payroll_periods" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "audit_logs" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "social_posts" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "social_connections" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "waitlist_entries" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "performance_goals" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "performance_bonuses" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "rebook_records" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "review_requests" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "portal_permissions" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "churn_predictions" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "reyna_conversations" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "reyna_knowledge" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "api_keys" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "gift_cards" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "referral_codes" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "referrals" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "loyalty_accounts" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "memberships" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "marketing_campaigns" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "kiosk_sessions" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;
UPDATE "voice_call_logs" SET "tenantId" = 'clsalonenvy000000000000000' WHERE "tenantId" IS NULL;

-- Step 3: Mark super admin
UPDATE "users" SET "superAdmin" = true WHERE "email" = 'ceo@36west.org';
