-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('FREE', 'PRO', 'ULTRA');

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "Tier" NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'free',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "totalOutputTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "totalInputTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "windowOutputTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "windowInputTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "windowResetsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
