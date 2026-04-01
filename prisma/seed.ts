import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.question.createMany({
    data: [
      {
        rotation: "Surgery",
        service: "ACS",
        subspecialty: null,
        question: "What is blood supply and venous drainage to the gallbladder?",
        answer: "Cystic Artery (off R Hepatic), and none (many tiny vessels)",
      },
      {
        rotation: "Surgery",
        service: "Other",
        subspecialty: "Vascular",
        question: "What is the lethal triad in trauma?",
        answer: "Hypothermia, acidosis, coagulopathy",
      },
      {
        rotation: "Surgery",
        service: "CRS",
        subspecialty: null,
        question: "Why use NG tube post-op SBO?",
        answer: "Decompress bowel, reduce vomiting, prevent aspiration",
      },
      {
        rotation: "Pediatrics",
        service: "NICU/PICU",
        subspecialty: null,
        question: "What are the components of APGAR score?",
        answer: "Appearance, Pulse, Grimace, Activity, Respiration",
      },
    ],
  });

  console.log("🌱 Seeded database");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });