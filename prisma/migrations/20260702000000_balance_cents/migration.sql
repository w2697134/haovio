UPDATE "User"
SET "pointsBalance" = "pointsBalance" * 100;

UPDATE "PointLedger"
SET
  "amount" = "amount" * 100,
  "balanceAfter" = "balanceAfter" * 100;

UPDATE "PointRedeem"
SET "pointsCost" = "pointsCost" * 100;

UPDATE "PointCode"
SET "amount" = "amount" * 100;

UPDATE "PointPurchaseOrder"
SET "points" = "points" * 100;
