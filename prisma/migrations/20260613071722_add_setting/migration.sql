-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "contacts" TEXT NOT NULL DEFAULT '[]',
    "qrUrl" TEXT,
    "instruction" TEXT NOT NULL DEFAULT '下单后请复制订单号,通过下方联系方式加我,确认收款后立即为你充值。',
    "updatedAt" DATETIME NOT NULL
);
