-- CreateTable
CREATE TABLE "PointCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNUSED',
    "batchName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" DATETIME,
    "usedById" TEXT,
    CONSTRAINT "PointCode_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PointLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "note" TEXT,
    "refType" TEXT,
    "refId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "PointLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PointRedeem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "productName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "contactQq" TEXT,
    "contactWechat" TEXT,
    "deliveryMode" TEXT NOT NULL DEFAULT 'MANUAL',
    "accountInfo" TEXT NOT NULL DEFAULT '{}',
    "cookieJsonCipher" TEXT,
    "cookieHeaderCipher" TEXT,
    "cookieMeta" TEXT NOT NULL DEFAULT '{}',
    "adminNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "processedAt" DATETIME,
    "completedAt" DATETIME,
    "userId" TEXT NOT NULL,
    "variantId" TEXT,
    CONSTRAINT "PointRedeem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PointRedeem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "inviteCode" TEXT,
    "invitedById" TEXT,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "User_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "inviteCode", "invitedById", "name", "passwordHash", "role", "updatedAt") SELECT "createdAt", "email", "id", "inviteCode", "invitedById", "name", "passwordHash", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_inviteCode_key" ON "User"("inviteCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PointCode_code_key" ON "PointCode"("code");

-- CreateIndex
CREATE INDEX "PointCode_status_createdAt_idx" ON "PointCode"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PointCode_batchName_idx" ON "PointCode"("batchName");

-- CreateIndex
CREATE INDEX "PointCode_usedById_usedAt_idx" ON "PointCode"("usedById", "usedAt");

-- CreateIndex
CREATE INDEX "PointLedger_userId_createdAt_idx" ON "PointLedger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PointLedger_refType_refId_idx" ON "PointLedger"("refType", "refId");

-- CreateIndex
CREATE INDEX "PointRedeem_status_createdAt_idx" ON "PointRedeem"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PointRedeem_userId_createdAt_idx" ON "PointRedeem"("userId", "createdAt");
