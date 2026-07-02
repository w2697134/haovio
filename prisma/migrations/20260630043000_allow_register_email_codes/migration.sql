PRAGMA foreign_keys=OFF;

CREATE TABLE "new_EmailVerificationCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'BIND_EMAIL',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "EmailVerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_EmailVerificationCode" ("id", "email", "codeHash", "purpose", "attempts", "expiresAt", "consumedAt", "createdAt", "userId")
SELECT "id", "email", "codeHash", "purpose", "attempts", "expiresAt", "consumedAt", "createdAt", "userId"
FROM "EmailVerificationCode";

DROP TABLE "EmailVerificationCode";
ALTER TABLE "new_EmailVerificationCode" RENAME TO "EmailVerificationCode";

CREATE INDEX "EmailVerificationCode_userId_purpose_createdAt_idx" ON "EmailVerificationCode"("userId", "purpose", "createdAt");
CREATE INDEX "EmailVerificationCode_email_purpose_createdAt_idx" ON "EmailVerificationCode"("email", "purpose", "createdAt");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
