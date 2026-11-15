-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "linkId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_linkId_idx" ON "Report"("linkId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
