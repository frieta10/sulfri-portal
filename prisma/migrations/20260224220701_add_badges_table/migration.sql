/*
  Warnings:

  - You are about to drop the column `credly_username` on the `profile_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profile_settings" DROP COLUMN "credly_username";

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "skills" TEXT[],
    "category" TEXT NOT NULL,
    "credential_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "badges_category_idx" ON "badges"("category");

-- CreateIndex
CREATE INDEX "badges_sort_order_idx" ON "badges"("sort_order");
