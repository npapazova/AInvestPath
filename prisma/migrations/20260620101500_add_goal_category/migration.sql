-- Add explicit goal category for filtering and allocation views.
ALTER TABLE "Goal" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'OTHER';
