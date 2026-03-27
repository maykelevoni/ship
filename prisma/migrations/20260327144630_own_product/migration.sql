-- CreateTable
CREATE TABLE "OwnProduct" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "outline" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'outline',
    "platform" TEXT,
    "checkoutUrl" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 9.99,
    "promotionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnProduct_pkey" PRIMARY KEY ("id")
);
