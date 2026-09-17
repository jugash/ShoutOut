-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "illustration" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_values" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shoutouts" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "value_id" TEXT NOT NULL,
    "message" VARCHAR(280) NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "edited_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shoutouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shoutout_recipients" (
    "shoutout_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "shoutout_recipients_pkey" PRIMARY KEY ("shoutout_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cards_slug_key" ON "cards"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "company_values_slug_key" ON "company_values"("slug");

-- CreateIndex
CREATE INDEX "shoutouts_created_at_id_idx" ON "shoutouts"("created_at" DESC, "id");

-- CreateIndex
CREATE INDEX "shoutouts_sender_id_created_at_idx" ON "shoutouts"("sender_id", "created_at");

-- CreateIndex
CREATE INDEX "shoutout_recipients_user_id_idx" ON "shoutout_recipients"("user_id");

-- CreateIndex
CREATE INDEX "users_active_name_idx" ON "users"("active", "name");

-- AddForeignKey
ALTER TABLE "shoutouts" ADD CONSTRAINT "shoutouts_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shoutouts" ADD CONSTRAINT "shoutouts_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shoutouts" ADD CONSTRAINT "shoutouts_value_id_fkey" FOREIGN KEY ("value_id") REFERENCES "company_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shoutout_recipients" ADD CONSTRAINT "shoutout_recipients_shoutout_id_fkey" FOREIGN KEY ("shoutout_id") REFERENCES "shoutouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shoutout_recipients" ADD CONSTRAINT "shoutout_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed: default cards
INSERT INTO "cards" ("id", "slug", "title", "tagline", "illustration", "tone", "sort_order", "updated_at") VALUES
  ('card_thank-you', 'thank-you', 'Thank You', 'For being awesome', 'heart', 'coral', 1, CURRENT_TIMESTAMP),
  ('card_above-and-beyond', 'above-and-beyond', 'Above & Beyond', 'Went the extra mile', 'rocket', 'lilac', 2, CURRENT_TIMESTAMP),
  ('card_team-player', 'team-player', 'Team Player', 'A true helping hand', 'buddies', 'teal', 3, CURRENT_TIMESTAMP),
  ('card_innovator', 'innovator', 'Great Idea', 'Brilliant thinking', 'lightbulb', 'sunny', 4, CURRENT_TIMESTAMP),
  ('card_welcome-aboard', 'welcome-aboard', 'Welcome Aboard', 'So glad you''re here', 'sailboat', 'sky', 5, CURRENT_TIMESTAMP),
  ('card_congrats', 'congrats', 'Congrats', 'Time to celebrate', 'party-popper', 'leaf', 6, CURRENT_TIMESTAMP),
  ('card_customer-hero', 'customer-hero', 'Customer Hero', 'Saved the day', 'shield', 'coral', 7, CURRENT_TIMESTAMP),
  ('card_problem-solver', 'problem-solver', 'Problem Solver', 'Cracked it', 'puzzle', 'lilac', 8, CURRENT_TIMESTAMP),
  ('card_mentor', 'mentor', 'Mentor', 'Helping others grow', 'sprout', 'teal', 9, CURRENT_TIMESTAMP),
  ('card_crushed-it', 'crushed-it', 'Crushed It', 'Outstanding result', 'trophy', 'sunny', 10, CURRENT_TIMESTAMP);

-- Seed: company values
INSERT INTO "company_values" ("id", "slug", "name", "sort_order", "updated_at") VALUES
  ('value_integrity', 'integrity', 'Integrity', 1, CURRENT_TIMESTAMP),
  ('value_diversity', 'diversity', 'Diversity', 2, CURRENT_TIMESTAMP),
  ('value_excellence', 'excellence', 'Excellence', 3, CURRENT_TIMESTAMP),
  ('value_collaboration', 'collaboration', 'Collaboration', 4, CURRENT_TIMESTAMP),
  ('value_engagement', 'engagement', 'Engagement', 5, CURRENT_TIMESTAMP);

-- Guard against blank messages at the database level too.
ALTER TABLE "shoutouts" ADD CONSTRAINT "shoutouts_message_not_blank" CHECK (length(btrim("message")) > 0);
