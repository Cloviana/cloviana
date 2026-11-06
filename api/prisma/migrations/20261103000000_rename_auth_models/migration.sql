-- Rename for consistent realm naming: profiles -> platform_users, auth_* -> marketplace_*,
-- and members/customers.authUserId -> marketplaceUserId. Renames only, no data changes.
-- Postgres keeps FKs and indexes attached across renames but not their names, so those are
-- renamed too, to the names Prisma generates for the new schema.

ALTER TABLE "profiles" RENAME TO "platform_users";
ALTER TABLE "platform_users" RENAME CONSTRAINT "profiles_pkey" TO "platform_users_pkey";
ALTER INDEX "profiles_email_key" RENAME TO "platform_users_email_key";

ALTER TABLE "auth_users" RENAME TO "marketplace_users";
ALTER TABLE "marketplace_users" RENAME CONSTRAINT "auth_users_pkey" TO "marketplace_users_pkey";
ALTER INDEX "auth_users_email_key" RENAME TO "marketplace_users_email_key";

ALTER TABLE "auth_sessions" RENAME TO "marketplace_sessions";
ALTER TABLE "marketplace_sessions" RENAME CONSTRAINT "auth_sessions_pkey" TO "marketplace_sessions_pkey";
ALTER TABLE "marketplace_sessions" RENAME CONSTRAINT "auth_sessions_userId_fkey" TO "marketplace_sessions_userId_fkey";
ALTER INDEX "auth_sessions_token_key" RENAME TO "marketplace_sessions_token_key";
ALTER INDEX "auth_sessions_userId_idx" RENAME TO "marketplace_sessions_userId_idx";

ALTER TABLE "auth_accounts" RENAME TO "marketplace_accounts";
ALTER TABLE "marketplace_accounts" RENAME CONSTRAINT "auth_accounts_pkey" TO "marketplace_accounts_pkey";
ALTER TABLE "marketplace_accounts" RENAME CONSTRAINT "auth_accounts_userId_fkey" TO "marketplace_accounts_userId_fkey";
ALTER INDEX "auth_accounts_userId_idx" RENAME TO "marketplace_accounts_userId_idx";

ALTER TABLE "auth_verifications" RENAME TO "marketplace_verifications";
ALTER TABLE "marketplace_verifications" RENAME CONSTRAINT "auth_verifications_pkey" TO "marketplace_verifications_pkey";
ALTER INDEX "auth_verifications_identifier_idx" RENAME TO "marketplace_verifications_identifier_idx";

ALTER TABLE "members" RENAME COLUMN "authUserId" TO "marketplaceUserId";
ALTER TABLE "members" RENAME CONSTRAINT "members_authUserId_fkey" TO "members_marketplaceUserId_fkey";
ALTER INDEX "members_marketplaceId_authUserId_key" RENAME TO "members_marketplaceId_marketplaceUserId_key";

ALTER TABLE "customers" RENAME COLUMN "authUserId" TO "marketplaceUserId";
ALTER TABLE "customers" RENAME CONSTRAINT "customers_authUserId_fkey" TO "customers_marketplaceUserId_fkey";
ALTER INDEX "customers_marketplaceId_authUserId_key" RENAME TO "customers_marketplaceId_marketplaceUserId_key";
