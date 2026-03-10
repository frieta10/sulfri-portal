-- Create DateType enum
CREATE TYPE "DateType" AS ENUM ('STRAIGHT', 'SEGREGATED');

-- Add new columns to classes table
ALTER TABLE "classes" ADD COLUMN "date_type" "DateType" NOT NULL DEFAULT 'STRAIGHT';
ALTER TABLE "classes" ADD COLUMN "number_of_days" INTEGER NOT NULL DEFAULT 1;

-- Create class_sessions table
CREATE TABLE "class_sessions" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "session_date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "class_sessions_class_id_idx" ON "class_sessions"("class_id");
CREATE INDEX "class_sessions_session_date_idx" ON "class_sessions"("session_date");
CREATE INDEX "class_sessions_display_order_idx" ON "class_sessions"("display_order");

-- Add foreign key constraint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_class_id_fkey" 
    FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
