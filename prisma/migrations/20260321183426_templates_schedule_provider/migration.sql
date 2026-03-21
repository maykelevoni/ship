-- AlterTable
ALTER TABLE "ContentPiece" ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'claude',
ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "charLimit" INTEGER,
    "imageEnabled" BOOLEAN NOT NULL DEFAULT false,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "videoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "videoWidth" INTEGER,
    "videoHeight" INTEGER,
    "includeLink" BOOLEAN NOT NULL DEFAULT false,
    "aiInstructions" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleEntry" (
    "id" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "daysOfWeek" TEXT NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScheduleEntry" ADD CONSTRAINT "ScheduleEntry_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
