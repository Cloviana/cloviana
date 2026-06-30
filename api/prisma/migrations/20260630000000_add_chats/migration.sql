CREATE TYPE "ChatMessageRole" AS ENUM ('user', 'assistant');

CREATE TABLE "chats" (
    "id" UUID NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "chatId" UUID NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chats_businessId_updatedAt_idx"
ON "chats"("businessId", "updatedAt");

CREATE INDEX "chat_messages_chatId_createdAt_idx"
ON "chat_messages"("chatId", "createdAt");

ALTER TABLE "chats"
ADD CONSTRAINT "chats_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_messages"
ADD CONSTRAINT "chat_messages_chatId_fkey"
FOREIGN KEY ("chatId") REFERENCES "chats"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
