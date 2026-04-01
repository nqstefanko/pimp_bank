import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const questionId = Number(id);

  if (Number.isNaN(questionId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json();
  const { subspecialty, question, answer } = body;

  const updatedQuestion = await prisma.question.update({
    where: { id: questionId },
    data: {
      subspecialty,
      question,
      answer,
    },
  });

  return NextResponse.json(updatedQuestion);
}

export async function DELETE(_: Request, context: RouteContext) {
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