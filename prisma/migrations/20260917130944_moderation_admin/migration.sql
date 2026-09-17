-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('INAPPROPRIATE', 'OFFENSIVE', 'SPAM', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportResolution" AS ENUM ('RESTORED', 'REMOVED');

-- DropIndex
DROP INDEX "shoutouts_value_id_idx";

-- AlterTable
ALTER TABLE "shoutouts" ADD COLUMN     "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'VISIBLE';

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "shoutout_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolution" "ReportResolution",
    "resolved_by_id" TEXT,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_resolved_at_created_at_idx" ON "reports"("resolved_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reports_shoutout_id_reporter_id_key" ON "reports"("shoutout_id", "reporter_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_shoutout_id_fkey" FOREIGN KEY ("shoutout_id") REFERENCES "shoutouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Case-insensitive uniqueness for names admins type in.
CREATE UNIQUE INDEX "company_values_name_lower_key" ON "company_values" (lower("name"));
CREATE UNIQUE INDEX "cards_title_lower_key" ON "cards" (lower("title"));

CREATE INDEX "shoutouts_moderation_status_idx" ON "shoutouts"("moderation_status") WHERE "moderation_status" <> 'VISIBLE';
