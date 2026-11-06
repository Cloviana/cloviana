CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");
