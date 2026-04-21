-- Flip tenantId to NOT NULL at the database level on all tenant-scoped tables.
-- The Prisma schema keeps String? for type compatibility with the extension,
-- but the DB constraint prevents NULLs from being stored.
-- User.tenantId stays nullable (global users, super admin).

ALTER TABLE "locations" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "staff_members" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "inventory_items" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "schedules" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "shifts" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "admin_alerts" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "purchase_orders" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "conduct_records" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "onboarding_enrollments" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "clients" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "client_formulas" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "card_on_file_requests" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "appointment_notes" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "financial_accounts" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "expenses" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "booth_rentals" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "tax_records" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "contractor_payments" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "business_models" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "offboarding_records" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "payroll_periods" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "audit_logs" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "social_posts" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "social_connections" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "waitlist_entries" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "performance_goals" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "performance_bonuses" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "rebook_records" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "review_requests" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "portal_permissions" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "churn_predictions" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "reyna_conversations" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "reyna_knowledge" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "api_keys" ALTER COLUMN "tenantId" SET NOT NULL;
