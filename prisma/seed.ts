import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create people first
  const failla = await prisma.person.upsert({
    where: {
      nameRole: {
        name: "Failla",
        role: "RESIDENT",
      },
    },
    update: {},
    create: {
      name: "Failla",
      role: "RESIDENT",
    },
  });

  const lucking = await prisma.person.upsert({
    where: {
      nameRole: {
        name: "Lucking",
        role: "ATTENDING",
      },
    },
    update: {},
    create: {
      name: "Lucking",
      role: "ATTENDING",
    },
  });

  // Now create questions

  // 1. ACS → Resident Dr. Failla
  await prisma.question.create({
    data: {
      rotation: "Surgery",
      service: "ACS",
      subspecialty: null,
      question:
        "What is blood supply and venous drainage to the gallbladder?",
      answer:
        "Cystic Artery (off R Hepatic), and none (many tiny vessels)",
      askedById: failla.id,
    },
  });

  // 2. Vascular → no one
  await prisma.question.create({
    data: {
      rotation: "Surgery",
      service: "Other",
      subspecialty: "Vascular",
      question: "What is the lethal triad in trauma?",
      answer: "Hypothermia, acidosis, coagulopathy",
      // no askedById → null
    },
  });

  // 3. CRS → Attending Dr. Lucking
  await prisma.question.create({
    data: {
      rotation: "Surgery",
      service: "CRS",
      subspecialty: null,
      question: "Why use NG tube post-op SBO?",
      answer:
        "Decompress bowel, reduce vomiting, prevent aspiration",
      askedById: lucking.id,
    },
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