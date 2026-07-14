-- AlterEnum
ALTER TYPE "TransactionKind" ADD VALUE 'transfer';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "transferDirection" TEXT;

