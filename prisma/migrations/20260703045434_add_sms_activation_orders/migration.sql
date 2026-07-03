-- CreateTable
CREATE TABLE "SmsActivationOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'BUYING',
    "productName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "serviceCode" TEXT NOT NULL DEFAULT 'openai',
    "countryCode" TEXT NOT NULL DEFAULT 'usa',
    "operatorCode" TEXT NOT NULL DEFAULT 'any',
    "provider" TEXT NOT NULL DEFAULT '5SIM',
    "providerOrderId" TEXT,
    "phone" TEXT,
    "smsCode" TEXT,
    "smsText" TEXT,
    "providerPayload" TEXT NOT NULL DEFAULT '{}',
    "error" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "userId" TEXT NOT NULL,
    "variantId" TEXT,
    CONSTRAINT "SmsActivationOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SmsActivationOrder_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SmsActivationOrder_providerOrderId_key" ON "SmsActivationOrder"("providerOrderId");

-- CreateIndex
CREATE INDEX "SmsActivationOrder_userId_createdAt_idx" ON "SmsActivationOrder"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SmsActivationOrder_status_expiresAt_idx" ON "SmsActivationOrder"("status", "expiresAt");
