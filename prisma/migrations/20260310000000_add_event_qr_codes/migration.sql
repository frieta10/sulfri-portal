-- CreateEnum
CREATE TYPE "QRCodeStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CLOSED');

-- CreateTable
CREATE TABLE "event_qr_codes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "utm_source" TEXT,
    "event_start_date" TIMESTAMP(3),
    "event_end_date" TIMESTAMP(3),
    "status" "QRCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "qr_url" TEXT NOT NULL,
    "qr_data_url" TEXT NOT NULL,
    "qr_svg" TEXT NOT NULL,
    "scan_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_qr_codes_status_idx" ON "event_qr_codes"("status");

-- CreateIndex
CREATE INDEX "event_qr_codes_event_end_date_idx" ON "event_qr_codes"("event_end_date");

-- CreateIndex
CREATE INDEX "event_qr_codes_created_at_idx" ON "event_qr_codes"("created_at");
