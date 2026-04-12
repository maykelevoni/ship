-- CreateTable
CREATE TABLE "AutopilotRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "days" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,
    "sources" TEXT,
    "platforms" TEXT,
    "promotionId" TEXT,
    "gate" BOOLEAN NOT NULL DEFAULT false,
    "keyword" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutopilotRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutopilotRule_userId_idx" ON "AutopilotRule"("userId");

-- AddForeignKey
ALTER TABLE "AutopilotRule" ADD CONSTRAINT "AutopilotRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
