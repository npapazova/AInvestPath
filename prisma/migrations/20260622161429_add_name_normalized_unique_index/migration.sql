/*
  Warnings:

  - Added the required column `nameNormalized` to the `Goal` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "targetAmount" REAL NOT NULL,
    "currentAmount" REAL NOT NULL,
    "monthlyContribution" REAL NOT NULL,
    "expectedReturn" REAL NOT NULL,
    "targetDate" DATETIME NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Goal" ("createdAt", "currentAmount", "expectedReturn", "id", "monthlyContribution", "name", "nameNormalized", "notes", "priority", "status", "targetAmount", "targetDate", "updatedAt") 
SELECT "createdAt", "currentAmount", "expectedReturn", "id", "monthlyContribution", "name", LOWER(TRIM("name")), "notes", "priority", "status", "targetAmount", "targetDate", "updatedAt" FROM "Goal";
DROP TABLE "Goal";
ALTER TABLE "new_Goal" RENAME TO "Goal";
CREATE UNIQUE INDEX "Goal_nameNormalized_key" ON "Goal"("nameNormalized");
CREATE INDEX "Goal_status_idx" ON "Goal"("status");
CREATE INDEX "Goal_priority_idx" ON "Goal"("priority");
CREATE INDEX "Goal_targetDate_idx" ON "Goal"("targetDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
