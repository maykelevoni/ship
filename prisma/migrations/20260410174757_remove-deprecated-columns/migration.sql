-- Remove geo fields from Promotion
ALTER TABLE "Promotion" DROP COLUMN IF EXISTS "geoScore";
ALTER TABLE "Promotion" DROP COLUMN IF EXISTS "geoIssues";
ALTER TABLE "Promotion" DROP COLUMN IF EXISTS "geoAuditedAt";

-- Remove geo fields from BlogPost
ALTER TABLE "BlogPost" DROP COLUMN IF EXISTS "geoScore";
ALTER TABLE "BlogPost" DROP COLUMN IF EXISTS "geoIssues";
ALTER TABLE "BlogPost" DROP COLUMN IF EXISTS "geoAuditedAt";

-- Remove email sending fields from EmailDraft
ALTER TABLE "EmailDraft" DROP COLUMN IF EXISTS "status";
ALTER TABLE "EmailDraft" DROP COLUMN IF EXISTS "sentAt";

-- Remove checkoutUrl from OwnProduct
ALTER TABLE "OwnProduct" DROP COLUMN IF EXISTS "checkoutUrl";

-- Remove plan/Polar fields from User
ALTER TABLE "users" DROP COLUMN IF EXISTS "plan";
ALTER TABLE "users" DROP COLUMN IF EXISTS "polarCustomerId";
ALTER TABLE "users" DROP COLUMN IF EXISTS "planExpiresAt";
