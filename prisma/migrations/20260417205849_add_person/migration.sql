/*
  Warnings:

  - Made the column `service` on table `Question` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PersonRole" AS ENUM ('RESIDENT', 'ATTENDING', 'OTHER');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "askedById" INTEGER,
ALTER COLUMN "service" SET NOT NULL;

-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" "PersonRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_askedById_fkey" FOREIGN KEY ("askedById") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
