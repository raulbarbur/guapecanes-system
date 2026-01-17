-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "paidAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Sale_paidAt_idx" ON "Sale"("paidAt");
