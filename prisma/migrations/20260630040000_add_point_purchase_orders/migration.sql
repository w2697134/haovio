CREATE TABLE "PointPurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "points" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "payableCents" INTEGER NOT NULL,
    "paymentProvider" TEXT NOT NULL DEFAULT 'VMQ',
    "paymentType" TEXT NOT NULL DEFAULT '2',
    "providerOrderId" TEXT,
    "providerPayload" TEXT NOT NULL DEFAULT '{}',
    "cashierUrl" TEXT,
    "paidAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "PointPurchaseOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PointPurchaseOrder_orderNo_key" ON "PointPurchaseOrder"("orderNo");
CREATE INDEX "PointPurchaseOrder_userId_createdAt_idx" ON "PointPurchaseOrder"("userId", "createdAt");
CREATE INDEX "PointPurchaseOrder_status_expiresAt_idx" ON "PointPurchaseOrder"("status", "expiresAt");
CREATE INDEX "PointPurchaseOrder_providerOrderId_idx" ON "PointPurchaseOrder"("providerOrderId");
