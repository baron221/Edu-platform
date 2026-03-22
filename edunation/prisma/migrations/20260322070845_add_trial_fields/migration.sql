-- AlterTable
ALTER TABLE "User" ADD COLUMN     "instructorTrialUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "studentTrialUsed" BOOLEAN NOT NULL DEFAULT false;
