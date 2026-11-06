-- Platform login moves to Better Auth; profiles becomes the Better Auth user.

ALTER TABLE "profiles"
    ADD COLUMN "name" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "image" TEXT;

CREATE TABLE "platform_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "platform_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_accounts" (
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

    CONSTRAINT "platform_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_verifications" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "platform_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_sessions_token_key" ON "platform_sessions"("token");
CREATE INDEX "platform_sessions_userId_idx" ON "platform_sessions"("userId");
CREATE INDEX "platform_accounts_userId_idx" ON "platform_accounts"("userId");
CREATE INDEX "platform_verifications_identifier_idx" ON "platform_verifications"("identifier");

ALTER TABLE "platform_sessions" ADD CONSTRAINT "platform_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_accounts" ADD CONSTRAINT "platform_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
