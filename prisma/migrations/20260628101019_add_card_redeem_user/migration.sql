-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CardRedeem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "contactQq" TEXT,
    "contactWechat" TEXT,
    "cookieJsonCipher" TEXT NOT NULL,
    "cookieHeaderCipher" TEXT NOT NULL,
    "cookieMeta" TEXT NOT NULL DEFAULT '{}',
    "cookieClearedAt" DATETIME,
    "clearAfterAt" DATETIME,
    "renewalStatus" TEXT NOT NULL DEFAULT 'PENDING_CANCEL',
    "adminNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "processedAt" DATETIME,
    "completedAt" DATETIME,
    "userId" TEXT,
    "cardId" TEXT NOT NULL,
    CONSTRAINT "CardRedeem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CardRedeem_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CardCode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CardRedeem" ("adminNote", "cardId", "clearAfterAt", "completedAt", "contactQq", "contactWechat", "cookieClearedAt", "cookieHeaderCipher", "cookieJsonCipher", "cookieMeta", "createdAt", "id", "processedAt", "renewalStatus", "status", "updatedAt") SELECT "adminNote", "cardId", "clearAfterAt", "completedAt", "contactQq", "contactWechat", "cookieClearedAt", "cookieHeaderCipher", "cookieJsonCipher", "cookieMeta", "createdAt", "id", "processedAt", "renewalStatus", "status", "updatedAt" FROM "CardRedeem";
DROP TABLE "CardRedeem";
ALTER TABLE "new_CardRedeem" RENAME TO "CardRedeem";
CREATE UNIQUE INDEX "CardRedeem_cardId_key" ON "CardRedeem"("cardId");
CREATE INDEX "CardRedeem_status_createdAt_idx" ON "CardRedeem"("status", "createdAt");
CREATE INDEX "CardRedeem_renewalStatus_createdAt_idx" ON "CardRedeem"("renewalStatus", "createdAt");
CREATE INDEX "CardRedeem_userId_createdAt_idx" ON "CardRedeem"("userId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
