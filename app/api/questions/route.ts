import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET() {
  const questions = await prisma.question.findMany({
    include: { askedBy: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(questions);
}

export async function POST(request: Request) {
  const body = await request.json();

  const {
    rotation,
    service,
    subspecialty,
    question,
    answer,
    askedByName,
    askedByRole,
  } = body;

  if (
    !rotation ||
    !service ||
    !question ||
    !answer ||
    !askedByName ||
    !askedByRole
  ) {
    return NextResponse.json(
      {
        error:
          "Rotation, service, question, answer, askedByName, and askedByRole are required",
      },
      { status: 400 }
    );
  }

  const person = await prisma.person.upsert({
    where: {
      nameRole: {
        name: askedByName.trim(),
        role: askedByRole,
      },
    },
    update: {},
    create: {
      name: askedByName.trim(),
      role: askedByRole,
    },
  });

  const newQuestion = await prisma.question.create({
    data: {
      rotation,
      service,
      subspecialty: subspecialty || null,
      question: question.trim(),
      answer: answer.trim(),
      askedById: person.id,
    },
    include: {
      askedBy: true,
    },
  });

  return NextResponse.json(newQuestion, { status: 201 });
}