-- CreateTable
CREATE TABLE "reactions" (
    "shoutout_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("shoutout_id","user_id","emoji")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "shoutout_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comments_shoutout_id_created_at_idx" ON "comments"("shoutout_id", "created_at");

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_shoutout_id_fkey" FOREIGN KEY ("shoutout_id") REFERENCES "shoutouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_shoutout_id_fkey" FOREIGN KEY ("shoutout_id") REFERENCES "shoutouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Guard against blank comments at the database level too.
ALTER TABLE "comments" ADD CONSTRAINT "comments_body_not_blank" CHECK (length(btrim("body")) > 0);

-- Speeds up profile pages (shoutouts a person received).
CREATE INDEX "shoutouts_value_id_idx" ON "shoutouts"("value_id");
