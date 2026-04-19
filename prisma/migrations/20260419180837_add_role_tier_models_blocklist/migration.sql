/*
  Warnings:

  - You are about to drop the `Item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- DropTable
DROP TABLE "Item";

-- DropTable
DROP TABLE "Project";

-- DropEnum
DROP TYPE "ItemType";

-- DropEnum
DROP TYPE "Status";

-- CreateTable
CREATE TABLE "TierModel" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "tier" "Tier" NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TierModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelBlocklist" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelBlocklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TierModel_modelId_tier_key" ON "TierModel"("modelId", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "ModelBlocklist_modelId_key" ON "ModelBlocklist"("modelId");
