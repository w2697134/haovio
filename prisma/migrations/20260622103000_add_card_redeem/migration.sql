-- CreateTable
CREATE TABLE "CardCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "batchName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNUSED',
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" DATETIME
);

-- CreateTable
CREATE TABLE "CardRedeem" (
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
    "cardId" TEXT NOT NULL,
    CONSTRAINT "CardRedeem_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CardCode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CardCode_code_key" ON "CardCode"("code");

-- CreateIndex
CREATE INDEX "CardCode_status_createdAt_idx" ON "CardCode"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CardCode_batchName_idx" ON "CardCode"("batchName");

-- CreateIndex
CREATE UNIQUE INDEX "CardRedeem_cardId_key" ON "CardRedeem"("cardId");

-- CreateIndex
CREATE INDEX "CardRedeem_status_createdAt_idx" ON "CardRedeem"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CardRedeem_renewalStatus_createdAt_idx" ON "CardRedeem"("renewalStatus", "createdAt");
