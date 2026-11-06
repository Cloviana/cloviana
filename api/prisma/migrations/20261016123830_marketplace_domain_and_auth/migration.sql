-- CreateEnum
CREATE TYPE "SellerStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PROPOSED', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('SINGLE_SELECT', 'MULTI_SELECT', 'TEXT', 'UNIT', 'TOGGLE');

-- CreateEnum
CREATE TYPE "ProductChangeStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ProductChangeActionType" AS ENUM ('UPDATE', 'STATUS_CHANGE', 'VARIANT_ADD', 'VARIANT_UPDATE', 'VARIANT_REMOVE', 'ATTRIBUTE_ADD', 'ATTRIBUTE_UPDATE', 'ATTRIBUTE_REMOVE', 'PRODUCT_ADD', 'PRODUCT_DELETE', 'CHANGE_REQUESTED');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FULFILLED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CommissionRateType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "CommissionRuleReference" AS ENUM ('PRODUCT', 'CATEGORY', 'SELLER');

-- CreateEnum
CREATE TYPE "PayoutAccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'RESTRICTED', 'DISABLED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ReviewReference" AS ENUM ('PRODUCT', 'SELLER');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('REQUIRES_PAYMENT', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "SequenceName" AS ENUM ('ORDER_GROUP', 'ORDER', 'PAYOUT', 'REVIEW');

-- CreateTable
CREATE TABLE "marketplace_domains" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "hostname" CITEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "marketplace_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMPTZ(3),
    "refreshTokenExpiresAt" TIMESTAMPTZ(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_verifications" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auth_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "authUserId" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "locale" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sellers" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "handle" CITEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "phone" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "banner" TEXT,
    "websiteUrl" TEXT,
    "externalId" TEXT,
    "currencyCode" CHAR(3) NOT NULL,
    "status" "SellerStatus" NOT NULL DEFAULT 'PENDING',
    "statusReason" TEXT,
    "approvedAt" TIMESTAMPTZ(3),
    "rejectedAt" TIMESTAMPTZ(3),
    "closedFrom" TIMESTAMPTZ(3),
    "closedTo" TIMESTAMPTZ(3),
    "closureNote" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_professional_details" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "corporateName" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "taxId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "seller_professional_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_addresses" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "name" TEXT,
    "company" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "address1" TEXT NOT NULL,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "province" TEXT,
    "postalCode" TEXT NOT NULL,
    "phone" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "seller_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_payment_details" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "holderName" TEXT NOT NULL,
    "bankName" TEXT,
    "iban" TEXT,
    "bic" TEXT,
    "routingNumber" TEXT,
    "accountNumber" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "seller_payment_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_members" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "seller_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_invites" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "acceptedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "member_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_types" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_collections" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "handle" CITEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "parentId" UUID,
    "name" TEXT NOT NULL,
    "handle" CITEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tags" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "typeId" UUID,
    "collectionId" UUID,
    "title" TEXT NOT NULL,
    "handle" CITEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "thumbnail" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "barcode" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_sellers" (
    "marketplaceId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_sellers_pkey" PRIMARY KEY ("marketplaceId","productId","sellerId")
);

-- CreateTable
CREATE TABLE "category_sellers" (
    "marketplaceId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_sellers_pkey" PRIMARY KEY ("marketplaceId","categoryId","sellerId")
);

-- CreateTable
CREATE TABLE "product_category_links" (
    "marketplaceId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "product_category_links_pkey" PRIMARY KEY ("marketplaceId","productId","categoryId")
);

-- CreateTable
CREATE TABLE "product_tag_links" (
    "marketplaceId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "product_tag_links_pkey" PRIMARY KEY ("marketplaceId","productId","tagId")
);

-- CreateTable
CREATE TABLE "product_attributes" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "productId" UUID,
    "name" TEXT NOT NULL,
    "handle" CITEXT,
    "description" TEXT,
    "type" "AttributeType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isFilterable" BOOLEAN NOT NULL DEFAULT false,
    "isVariantAxis" BOOLEAN NOT NULL DEFAULT false,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attribute_values" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "attributeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "handle" CITEXT,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attribute_entries" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "attributeId" UUID NOT NULL,
    "valueId" UUID,
    "textValue" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_attribute_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_attribute_values" (
    "marketplaceId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "attributeValueId" UUID NOT NULL,

    CONSTRAINT "variant_attribute_values_pkey" PRIMARY KEY ("marketplaceId","variantId","attributeValueId")
);

-- CreateTable
CREATE TABLE "shipping_profiles" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "shipping_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "sku" TEXT,
    "stockedQuantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "requiresShipping" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "shippingProfileId" UUID,
    "sku" TEXT NOT NULL,
    "ean" TEXT,
    "upc" TEXT,
    "createdBy" UUID,
    "metadata" JSONB,
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_prices" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "currencyCode" CHAR(3) NOT NULL,
    "amount" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "offer_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_inventory_items" (
    "marketplaceId" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "inventoryItemId" UUID NOT NULL,
    "requiredQuantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "offer_inventory_items_pkey" PRIMARY KEY ("marketplaceId","offerId","inventoryItemId")
);

-- CreateTable
CREATE TABLE "product_changes" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "status" "ProductChangeStatus" NOT NULL DEFAULT 'PENDING',
    "internalNote" TEXT,
    "externalNote" TEXT,
    "createdBy" UUID,
    "confirmedBy" UUID,
    "confirmedAt" TIMESTAMPTZ(3),
    "declinedBy" UUID,
    "declinedAt" TIMESTAMPTZ(3),
    "declinedReason" TEXT,
    "canceledBy" UUID,
    "canceledAt" TIMESTAMPTZ(3),
    "requiresActionBy" UUID,
    "requiresActionAt" TIMESTAMPTZ(3),
    "requiresActionReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_change_actions" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "productChangeId" UUID,
    "ordering" SERIAL NOT NULL,
    "action" "ProductChangeActionType" NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "internalNote" TEXT,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_change_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "authUserId" UUID,
    "email" CITEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "customerId" UUID,
    "email" CITEXT,
    "currencyCode" CHAR(3) NOT NULL,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "shippingAddress" JSONB,
    "billingAddress" JSONB,
    "expiresAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_groups" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "displayId" INTEGER NOT NULL,
    "customerId" UUID,
    "cartId" UUID NOT NULL,
    "currencyCode" CHAR(3) NOT NULL,
    "sellerCount" INTEGER NOT NULL,
    "total" BIGINT NOT NULL,
    "metadata" JSONB,
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "order_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "displayId" INTEGER NOT NULL,
    "orderGroupId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "customerId" UUID,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "currencyCode" CHAR(3) NOT NULL,
    "email" CITEXT,
    "subtotal" BIGINT NOT NULL,
    "shippingTotal" BIGINT NOT NULL DEFAULT 0,
    "taxTotal" BIGINT NOT NULL DEFAULT 0,
    "total" BIGINT NOT NULL,
    "shippingAddress" JSONB,
    "billingAddress" JSONB,
    "canceledAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "variantTitle" TEXT,
    "sku" TEXT NOT NULL,
    "thumbnail" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" BIGINT NOT NULL,
    "taxTotal" BIGINT NOT NULL DEFAULT 0,
    "total" BIGINT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_shipping_methods" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "taxTotal" BIGINT NOT NULL DEFAULT 0,
    "total" BIGINT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_shipping_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rates" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CommissionRateType" NOT NULL,
    "value" DECIMAL(9,4) NOT NULL DEFAULT 0,
    "currencyCode" CHAR(3),
    "includeTax" BOOLEAN NOT NULL DEFAULT false,
    "includeShipping" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "commission_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rules" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "commissionRateId" UUID NOT NULL,
    "reference" "CommissionRuleReference" NOT NULL,
    "referenceId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rate_values" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "commissionRateId" UUID NOT NULL,
    "currencyCode" CHAR(3) NOT NULL,
    "amount" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_rate_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_lines" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "itemId" UUID,
    "shippingMethodId" UUID,
    "commissionRateId" UUID,
    "code" TEXT NOT NULL,
    "rate" DECIMAL(9,4) NOT NULL,
    "amount" BIGINT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_accounts" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "status" "PayoutAccountStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "externalAccountId" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "context" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payout_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_onboardings" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "data" JSONB,
    "context" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payout_onboardings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "displayId" INTEGER NOT NULL,
    "accountId" UUID NOT NULL,
    "currencyCode" CHAR(3) NOT NULL,
    "amount" BIGINT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "data" JSONB,
    "paidAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_orders" (
    "marketplaceId" UUID NOT NULL,
    "payoutId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "grossAmount" BIGINT NOT NULL,
    "commissionAmount" BIGINT NOT NULL,
    "netAmount" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_orders_pkey" PRIMARY KEY ("marketplaceId","payoutId","orderId")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "displayId" INTEGER NOT NULL,
    "reference" "ReviewReference" NOT NULL,
    "rating" INTEGER NOT NULL,
    "customerNote" TEXT,
    "sellerNote" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "customerId" UUID NOT NULL,
    "productId" UUID,
    "sellerId" UUID,
    "orderId" UUID,
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "orderGroupId" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "providerPaymentId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'REQUIRES_PAYMENT',
    "currencyCode" CHAR(3) NOT NULL,
    "amount" BIGINT NOT NULL,
    "capturedAt" TIMESTAMPTZ(3),
    "data" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "marketplaceId" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "orderId" UUID,
    "amount" BIGINT NOT NULL,
    "reason" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "providerRefundId" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ(3),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_sequences" (
    "marketplaceId" UUID NOT NULL,
    "name" "SequenceName" NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "marketplace_sequences_pkey" PRIMARY KEY ("marketplaceId","name")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_domains_hostname_key" ON "marketplace_domains"("hostname");

-- CreateIndex
CREATE INDEX "marketplace_domains_marketplaceId_idx" ON "marketplace_domains"("marketplaceId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_email_key" ON "auth_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_token_key" ON "auth_sessions"("token");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_idx" ON "auth_sessions"("userId");

-- CreateIndex
CREATE INDEX "auth_accounts_userId_idx" ON "auth_accounts"("userId");

-- CreateIndex
CREATE INDEX "auth_verifications_identifier_idx" ON "auth_verifications"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "roles_marketplaceId_id_key" ON "roles"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_marketplaceId_name_key" ON "roles"("marketplaceId", "name");

-- CreateIndex
CREATE INDEX "members_marketplaceId_email_idx" ON "members"("marketplaceId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "members_marketplaceId_id_key" ON "members"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "members_marketplaceId_authUserId_key" ON "members"("marketplaceId", "authUserId");

-- CreateIndex
CREATE INDEX "sellers_marketplaceId_status_idx" ON "sellers"("marketplaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sellers_marketplaceId_id_key" ON "sellers"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "sellers_marketplaceId_handle_key" ON "sellers"("marketplaceId", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "seller_professional_details_marketplaceId_sellerId_key" ON "seller_professional_details"("marketplaceId", "sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "seller_addresses_marketplaceId_sellerId_key" ON "seller_addresses"("marketplaceId", "sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "seller_payment_details_marketplaceId_sellerId_key" ON "seller_payment_details"("marketplaceId", "sellerId");

-- CreateIndex
CREATE INDEX "seller_members_marketplaceId_memberId_idx" ON "seller_members"("marketplaceId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "seller_members_marketplaceId_sellerId_memberId_key" ON "seller_members"("marketplaceId", "sellerId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "member_invites_tokenHash_key" ON "member_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "member_invites_marketplaceId_sellerId_idx" ON "member_invites"("marketplaceId", "sellerId");

-- CreateIndex
CREATE INDEX "member_invites_marketplaceId_email_idx" ON "member_invites"("marketplaceId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "product_types_marketplaceId_id_key" ON "product_types"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "product_types_marketplaceId_value_key" ON "product_types"("marketplaceId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "product_collections_marketplaceId_id_key" ON "product_collections"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "product_collections_marketplaceId_handle_key" ON "product_collections"("marketplaceId", "handle");

-- CreateIndex
CREATE INDEX "product_categories_marketplaceId_parentId_idx" ON "product_categories"("marketplaceId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_marketplaceId_id_key" ON "product_categories"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_marketplaceId_handle_key" ON "product_categories"("marketplaceId", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "product_tags_marketplaceId_id_key" ON "product_tags"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "product_tags_marketplaceId_value_key" ON "product_tags"("marketplaceId", "value");

-- CreateIndex
CREATE INDEX "products_marketplaceId_status_idx" ON "products"("marketplaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "products_marketplaceId_id_key" ON "products"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "products_marketplaceId_handle_key" ON "products"("marketplaceId", "handle");

-- CreateIndex
CREATE INDEX "product_images_marketplaceId_productId_idx" ON "product_images"("marketplaceId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_marketplaceId_id_key" ON "product_variants"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_marketplaceId_productId_id_key" ON "product_variants"("marketplaceId", "productId", "id");

-- CreateIndex
CREATE INDEX "product_sellers_marketplaceId_sellerId_idx" ON "product_sellers"("marketplaceId", "sellerId");

-- CreateIndex
CREATE INDEX "category_sellers_marketplaceId_sellerId_idx" ON "category_sellers"("marketplaceId", "sellerId");

-- CreateIndex
CREATE INDEX "product_category_links_marketplaceId_categoryId_idx" ON "product_category_links"("marketplaceId", "categoryId");

-- CreateIndex
CREATE INDEX "product_tag_links_marketplaceId_tagId_idx" ON "product_tag_links"("marketplaceId", "tagId");

-- CreateIndex
CREATE INDEX "product_attributes_marketplaceId_productId_idx" ON "product_attributes"("marketplaceId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_attributes_marketplaceId_id_key" ON "product_attributes"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "product_attributes_marketplaceId_handle_key" ON "product_attributes"("marketplaceId", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "product_attribute_values_marketplaceId_id_key" ON "product_attribute_values"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "product_attribute_values_marketplaceId_attributeId_handle_key" ON "product_attribute_values"("marketplaceId", "attributeId", "handle");

-- CreateIndex
CREATE INDEX "product_attribute_entries_marketplaceId_productId_idx" ON "product_attribute_entries"("marketplaceId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_attribute_entries_marketplaceId_productId_attribute_key" ON "product_attribute_entries"("marketplaceId", "productId", "attributeId", "valueId");

-- CreateIndex
CREATE INDEX "variant_attribute_values_marketplaceId_attributeValueId_idx" ON "variant_attribute_values"("marketplaceId", "attributeValueId");

-- CreateIndex
CREATE INDEX "shipping_profiles_marketplaceId_sellerId_idx" ON "shipping_profiles"("marketplaceId", "sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_profiles_marketplaceId_id_key" ON "shipping_profiles"("marketplaceId", "id");

-- CreateIndex
CREATE INDEX "inventory_items_marketplaceId_sellerId_idx" ON "inventory_items"("marketplaceId", "sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_marketplaceId_id_key" ON "inventory_items"("marketplaceId", "id");

-- CreateIndex
CREATE INDEX "offers_marketplaceId_sellerId_sku_idx" ON "offers"("marketplaceId", "sellerId", "sku");

-- CreateIndex
CREATE INDEX "offers_marketplaceId_productId_idx" ON "offers"("marketplaceId", "productId");

-- CreateIndex
CREATE INDEX "offers_marketplaceId_variantId_idx" ON "offers"("marketplaceId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "offers_marketplaceId_id_key" ON "offers"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "offer_prices_marketplaceId_offerId_currencyCode_key" ON "offer_prices"("marketplaceId", "offerId", "currencyCode");

-- CreateIndex
CREATE INDEX "offer_inventory_items_marketplaceId_inventoryItemId_idx" ON "offer_inventory_items"("marketplaceId", "inventoryItemId");

-- CreateIndex
CREATE INDEX "product_changes_marketplaceId_productId_status_idx" ON "product_changes"("marketplaceId", "productId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "product_changes_marketplaceId_id_key" ON "product_changes"("marketplaceId", "id");

-- CreateIndex
CREATE INDEX "product_change_actions_marketplaceId_productId_idx" ON "product_change_actions"("marketplaceId", "productId");

-- CreateIndex
CREATE INDEX "product_change_actions_marketplaceId_productChangeId_orderi_idx" ON "product_change_actions"("marketplaceId", "productChangeId", "ordering");

-- CreateIndex
CREATE INDEX "customers_marketplaceId_email_idx" ON "customers"("marketplaceId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_marketplaceId_id_key" ON "customers"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_marketplaceId_authUserId_key" ON "customers"("marketplaceId", "authUserId");

-- CreateIndex
CREATE INDEX "carts_marketplaceId_customerId_idx" ON "carts"("marketplaceId", "customerId");

-- CreateIndex
CREATE INDEX "carts_marketplaceId_status_idx" ON "carts"("marketplaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "carts_marketplaceId_id_key" ON "carts"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_marketplaceId_cartId_offerId_key" ON "cart_items"("marketplaceId", "cartId", "offerId");

-- CreateIndex
CREATE INDEX "order_groups_marketplaceId_customerId_idx" ON "order_groups"("marketplaceId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "order_groups_marketplaceId_id_key" ON "order_groups"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "order_groups_marketplaceId_displayId_key" ON "order_groups"("marketplaceId", "displayId");

-- CreateIndex
CREATE UNIQUE INDEX "order_groups_marketplaceId_cartId_key" ON "order_groups"("marketplaceId", "cartId");

-- CreateIndex
CREATE INDEX "orders_marketplaceId_sellerId_status_idx" ON "orders"("marketplaceId", "sellerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "orders_marketplaceId_id_key" ON "orders"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_marketplaceId_displayId_key" ON "orders"("marketplaceId", "displayId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_marketplaceId_orderGroupId_sellerId_key" ON "orders"("marketplaceId", "orderGroupId", "sellerId");

-- CreateIndex
CREATE INDEX "order_items_marketplaceId_orderId_idx" ON "order_items"("marketplaceId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_marketplaceId_id_key" ON "order_items"("marketplaceId", "id");

-- CreateIndex
CREATE INDEX "order_shipping_methods_marketplaceId_orderId_idx" ON "order_shipping_methods"("marketplaceId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_shipping_methods_marketplaceId_id_key" ON "order_shipping_methods"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "commission_rates_marketplaceId_id_key" ON "commission_rates"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "commission_rates_marketplaceId_code_key" ON "commission_rates"("marketplaceId", "code");

-- CreateIndex
CREATE INDEX "commission_rules_marketplaceId_reference_referenceId_idx" ON "commission_rules"("marketplaceId", "reference", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "commission_rules_marketplaceId_commissionRateId_reference_r_key" ON "commission_rules"("marketplaceId", "commissionRateId", "reference", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "commission_rate_values_marketplaceId_commissionRateId_curre_key" ON "commission_rate_values"("marketplaceId", "commissionRateId", "currencyCode");

-- CreateIndex
CREATE INDEX "commission_lines_marketplaceId_orderId_idx" ON "commission_lines"("marketplaceId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "payout_accounts_marketplaceId_id_key" ON "payout_accounts"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "payout_accounts_marketplaceId_sellerId_key" ON "payout_accounts"("marketplaceId", "sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "payout_accounts_provider_externalAccountId_key" ON "payout_accounts"("provider", "externalAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "payout_onboardings_marketplaceId_accountId_key" ON "payout_onboardings"("marketplaceId", "accountId");

-- CreateIndex
CREATE INDEX "payouts_marketplaceId_accountId_status_idx" ON "payouts"("marketplaceId", "accountId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_marketplaceId_id_key" ON "payouts"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_marketplaceId_displayId_key" ON "payouts"("marketplaceId", "displayId");

-- CreateIndex
CREATE UNIQUE INDEX "payout_orders_marketplaceId_orderId_key" ON "payout_orders"("marketplaceId", "orderId");

-- CreateIndex
CREATE INDEX "reviews_marketplaceId_productId_status_idx" ON "reviews"("marketplaceId", "productId", "status");

-- CreateIndex
CREATE INDEX "reviews_marketplaceId_sellerId_status_idx" ON "reviews"("marketplaceId", "sellerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_marketplaceId_id_key" ON "reviews"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_marketplaceId_displayId_key" ON "reviews"("marketplaceId", "displayId");

-- CreateIndex
CREATE INDEX "payments_marketplaceId_orderGroupId_idx" ON "payments"("marketplaceId", "orderGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_marketplaceId_id_key" ON "payments"("marketplaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_providerPaymentId_key" ON "payments"("provider", "providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_providerRefundId_key" ON "refunds"("providerRefundId");

-- CreateIndex
CREATE INDEX "refunds_marketplaceId_paymentId_idx" ON "refunds"("marketplaceId", "paymentId");

-- CreateIndex
CREATE INDEX "refunds_marketplaceId_orderId_idx" ON "refunds"("marketplaceId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_eventId_key" ON "webhook_events"("provider", "eventId");

-- AddForeignKey
ALTER TABLE "marketplace_domains" ADD CONSTRAINT "marketplace_domains_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_professional_details" ADD CONSTRAINT "seller_professional_details_marketplaceId_sellerId_fkey" FOREIGN KEY ("marketplaceId", "sellerId") REFERENCES "sellers"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_addresses" ADD CONSTRAINT "seller_addresses_marketplaceId_sellerId_fkey" FOREIGN KEY ("marketplaceId", "sellerId") REFERENCES "sellers"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_payment_details" ADD CONSTRAINT "seller_payment_details_marketplaceId_sellerId_fkey" FOREIGN KEY ("marketplaceId", "sellerId") REFERENCES "sellers"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_members" ADD CONSTRAINT "seller_members_marketplaceId_sellerId_fkey" FOREIGN KEY ("marketplaceId", "sellerId") REFERENCES "sellers"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_members" ADD CONSTRAINT "seller_members_marketplaceId_memberId_fkey" FOREIGN KEY ("marketplaceId", "memberId") REFERENCES "members"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_members" ADD CONSTRAINT "seller_members_marketplaceId_roleId_fkey" FOREIGN KEY ("marketplaceId", "roleId") REFERENCES "roles"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_invites" ADD CONSTRAINT "member_invites_marketplaceId_sellerId_fkey" FOREIGN KEY ("marketplaceId", "sellerId") REFERENCES "sellers"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_invites" ADD CONSTRAINT "member_invites_marketplaceId_roleId_fkey" FOREIGN KEY ("marketplaceId", "roleId") REFERENCES "roles"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_types" ADD CONSTRAINT "product_types_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_marketplaceId_parentId_fkey" FOREIGN KEY ("marketplaceId", "parentId") REFERENCES "product_categories"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_marketplaceId_typeId_fkey" FOREIGN KEY ("marketplaceId", "typeId") REFERENCES "product_types"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_marketplaceId_collectionId_fkey" FOREIGN KEY ("marketplaceId", "collectionId") REFERENCES "product_collections"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_marketplaceId_productId_fkey" FOREIGN KEY ("marketplaceId", "productId") REFERENCES "products"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_marketplaceId_productId_fkey" FOREIGN KEY ("marketplaceId", "productId") REFERENCES "products"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_sellers" ADD CONSTRAINT "product_sellers_marketplaceId_productId_fkey" FOREIGN KEY ("marketplaceId", "productId") REFERENCES "products"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_sellers" ADD CONSTRAINT "product_sellers_marketplaceId_sellerId_fkey" FOREIGN KEY ("marketplaceId", "sellerId") REFERENCES "sellers"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_sellers" ADD CONSTRAINT "category_sellers_marketplaceId_categoryId_fkey" FOREIGN KEY ("marketplaceId", "categoryId") REFERENCES "product_categories"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_sellers" ADD CONSTRAINT "category_sellers_marketplaceId_sellerId_fkey" FOREIGN KEY ("marketplaceId", "sellerId") REFERENCES "sellers"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category_links" ADD CONSTRAINT "product_category_links_marketplaceId_productId_fkey" FOREIGN KEY ("marketplaceId", "productId") REFERENCES "products"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category_links" ADD CONSTRAINT "product_category_links_marketplaceId_categoryId_fkey" FOREIGN KEY ("marketplaceId", "categoryId") REFERENCES "product_categories"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tag_links" ADD CONSTRAINT "product_tag_links_marketplaceId_productId_fkey" FOREIGN KEY ("marketplaceId", "productId") REFERENCES "products"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tag_links" ADD CONSTRAINT "product_tag_links_marketplaceId_tagId_fkey" FOREIGN KEY ("marketplaceId", "tagId") REFERENCES "product_tags"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_marketplaceId_productId_fkey" FOREIGN KEY ("marketplaceId", "productId") REFERENCES "products"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_marketplaceId_attributeId_fkey" FOREIGN KEY ("marketplaceId", "attributeId") REFERENCES "product_attributes"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_entries" ADD CONSTRAINT "product_attribute_entries_marketplaceId_productId_fkey" FOREIGN KEY ("marketplaceId", "productId") REFERENCES "products"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_entries" ADD CONSTRAINT "product_attribute_entries_marketplaceId_attributeId_fkey" FOREIGN KEY ("marketplaceId", "attributeId") REFERENCES "product_attributes"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_entries" ADD CONSTRAINT "product_attribute_entries_marketplaceId_valueId_fkey" FOREIGN KEY ("marketplaceId", "valueId") REFERENCES "product_attribute_values"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_marketplaceId_variantId_fkey" FOREIGN KEY ("marketplaceId", "variantId") REFERENCES "product_variants"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_marketplaceId_attributeValueId_fkey" FOREIGN KEY ("marketplaceId", "attributeValueId") REFERENCES "product_attribute_values"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_profiles" ADD CONSTRAINT "shipping_profiles_marketplaceId_sellerId_fkey" FOREIGN KEY ("marketplaceId", "sellerId") REFERENCES "sellers"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_marketplaceId_sellerId_fkey" FOREIGN KEY ("marketplaceId", "sellerId") REFERENCES "sellers"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_marketplaceId_sellerId_fkey" FOREIGN KEY ("marketplaceId", "sellerId") REFERENCES "sellers"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_marketplaceId_productId_fkey" FOREIGN KEY ("marketplaceId", "productId") REFERENCES "products"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_marketplaceId_productId_variantId_fkey" FOREIGN KEY ("marketplaceId", "productId", "variantId") REFERENCES "product_variants"("marketplaceId", "productId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_marketplaceId_shippingProfileId_fkey" FOREIGN KEY ("marketplaceId", "shippingProfileId") REFERENCES "shipping_profiles"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_prices" ADD CONSTRAINT "offer_prices_marketplaceId_offerId_fkey" FOREIGN KEY ("marketplaceId", "offerId") REFERENCES "offers"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_inventory_items" ADD CONSTRAINT "offer_inventory_items_marketplaceId_offerId_fkey" FOREIGN KEY ("marketplaceId", "offerId") REFERENCES "offers"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_inventory_items" ADD CONSTRAINT "offer_inventory_items_marketplaceId_inventoryItemId_fkey" FOREIGN KEY ("marketplaceId", "inventoryItemId") REFERENCES "inventory_items"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_changes" ADD CONSTRAINT "product_changes_marketplaceId_productId_fkey" FOREIGN KEY ("marketplaceId", "productId") REFERENCES "products"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_change_actions" ADD CONSTRAINT "product_change_actions_marketplaceId_productId_fkey" FOREIGN KEY ("marketplaceId", "productId") REFERENCES "products"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_change_actions" ADD CONSTRAINT "product_change_actions_marketplaceId_productChangeId_fkey" FOREIGN KEY ("marketplaceId", "productChangeId") REFERENCES "product_changes"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_marketplaceId_customerId_fkey" FOREIGN KEY ("marketplaceId", "customerId") REFERENCES "customers"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_marketplaceId_cartId_fkey" FOREIGN KEY ("marketplaceId", "cartId") REFERENCES "carts"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_marketplaceId_offerId_fkey" FOREIGN KEY ("marketplaceId", "offerId") REFERENCES "offers"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_groups" ADD CONSTRAINT "order_groups_marketplaceId_customerId_fkey" FOREIGN KEY ("marketplaceId", "customerId") REFERENCES "customers"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_groups" ADD CONSTRAINT "order_groups_marketplaceId_cartId_fkey" FOREIGN KEY ("marketplaceId", "cartId") REFERENCES "carts"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_marketplaceId_orderGroupId_fkey" FOREIGN KEY ("marketplaceId", "orderGroupId") REFERENCES "order_groups"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_marketplaceId_sellerId_fkey" FOREIGN KEY ("marketplaceId", "sellerId") REFERENCES "sellers"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_marketplaceId_customerId_fkey" FOREIGN KEY ("marketplaceId", "customerId") REFERENCES "customers"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_marketplaceId_orderId_fkey" FOREIGN KEY ("marketplaceId", "orderId") REFERENCES "orders"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_marketplaceId_offerId_fkey" FOREIGN KEY ("marketplaceId", "offerId") REFERENCES "offers"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_shipping_methods" ADD CONSTRAINT "order_shipping_methods_marketplaceId_orderId_fkey" FOREIGN KEY ("marketplaceId", "orderId") REFERENCES "orders"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rates" ADD CONSTRAINT "commission_rates_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_marketplaceId_commissionRateId_fkey" FOREIGN KEY ("marketplaceId", "commissionRateId") REFERENCES "commission_rates"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rate_values" ADD CONSTRAINT "commission_rate_values_marketplaceId_commissionRateId_fkey" FOREIGN KEY ("marketplaceId", "commissionRateId") REFERENCES "commission_rates"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_lines" ADD CONSTRAINT "commission_lines_marketplaceId_orderId_fkey" FOREIGN KEY ("marketplaceId", "orderId") REFERENCES "orders"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_lines" ADD CONSTRAINT "commission_lines_marketplaceId_itemId_fkey" FOREIGN KEY ("marketplaceId", "itemId") REFERENCES "order_items"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_lines" ADD CONSTRAINT "commission_lines_marketplaceId_shippingMethodId_fkey" FOREIGN KEY ("marketplaceId", "shippingMethodId") REFERENCES "order_shipping_methods"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_lines" ADD CONSTRAINT "commission_lines_marketplaceId_commissionRateId_fkey" FOREIGN KEY ("marketplaceId", "commissionRateId") REFERENCES "commission_rates"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_accounts" ADD CONSTRAINT "payout_accounts_marketplaceId_sellerId_fkey" FOREIGN KEY ("marketplaceId", "sellerId") REFERENCES "sellers"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_onboardings" ADD CONSTRAINT "payout_onboardings_marketplaceId_accountId_fkey" FOREIGN KEY ("marketplaceId", "accountId") REFERENCES "payout_accounts"("marketplaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_marketplaceId_accountId_fkey" FOREIGN KEY ("marketplaceId", "accountId") REFERENCES "payout_accounts"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_orders" ADD CONSTRAINT "payout_orders_marketplaceId_payoutId_fkey" FOREIGN KEY ("marketplaceId", "payoutId") REFERENCES "payouts"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_orders" ADD CONSTRAINT "payout_orders_marketplaceId_orderId_fkey" FOREIGN KEY ("marketplaceId", "orderId") REFERENCES "orders"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_marketplaceId_customerId_fkey" FOREIGN KEY ("marketplaceId", "customerId") REFERENCES "customers"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_marketplaceId_productId_fkey" FOREIGN KEY ("marketplaceId", "productId") REFERENCES "products"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_marketplaceId_sellerId_fkey" FOREIGN KEY ("marketplaceId", "sellerId") REFERENCES "sellers"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_marketplaceId_orderId_fkey" FOREIGN KEY ("marketplaceId", "orderId") REFERENCES "orders"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_marketplaceId_orderGroupId_fkey" FOREIGN KEY ("marketplaceId", "orderGroupId") REFERENCES "order_groups"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_marketplaceId_paymentId_fkey" FOREIGN KEY ("marketplaceId", "paymentId") REFERENCES "payments"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_marketplaceId_orderId_fkey" FOREIGN KEY ("marketplaceId", "orderId") REFERENCES "orders"("marketplaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_sequences" ADD CONSTRAINT "marketplace_sequences_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
