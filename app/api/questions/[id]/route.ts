import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const questionId = Number(id);

  if (Number.isNaN(questionId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await prisma.question.delete({
    where: { id: questionId },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const questionId = Number(id);

  if (Number.isNaN(questionId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json();

  const {
    service,
    subspecialty,
    question,
    answer,
    askedByName,
    askedByRole,
  } = body;

  if (!service || !question || !answer || !askedByName || !askedByRole) {
    return NextResponse.json(
      {
        error:
          "Service, question, answer, askedByName, and askedByRole are required",
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

  const updatedQuestion = await prisma.question.update({
    where: { id: questionId },
    data: {
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

  return NextResponse.json(updatedQuestion);
}