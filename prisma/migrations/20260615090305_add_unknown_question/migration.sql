-- CreateTable
CREATE TABLE "UnknownQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "contacts" TEXT NOT NULL DEFAULT '[]',
    "qrUrl" TEXT,
    "instruction" TEXT NOT NULL DEFAULT '复制订单号,添加 QQ 确认办理与付款;完成后可加入 QQ 群处理售后。',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Setting" ("contacts", "id", "instruction", "qrUrl", "updatedAt") SELECT "contacts", "id", "instruction", "qrUrl", "updatedAt" FROM "Setting";
DROP TABLE "Setting";
ALTER TABLE "new_Setting" RENAME TO "Setting";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
