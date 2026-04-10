-- Add Systeme.io fields to Promotion
ALTER TABLE "Promotion" ADD COLUMN "systemeFunnelUrl" TEXT;
ALTER TABLE "Promotion" ADD COLUMN "systemeProductId" TEXT;
ALTER TABLE "Promotion" ADD COLUMN "systemeCheckoutUrl" TEXT;

-- Add exportedAt to EmailDraft
ALTER TABLE "EmailDraft" ADD COLUMN "exportedAt" TIMESTAMP(3);

-- Add Systeme.io fields to OwnProduct
ALTER TABLE "OwnProduct" ADD COLUMN "systemeProductId" TEXT;
ALTER TABLE "OwnProduct" ADD COLUMN "systemeCheckoutUrl" TEXT;
