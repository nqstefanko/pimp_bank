-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "service" TEXT,
ALTER COLUMN "subspecialty" DROP NOT NULL;
