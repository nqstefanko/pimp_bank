import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function GET() {
  const questions = await prisma.question.findMany({
    orderBy: { id: "asc" },
  });

  return NextResponse.json(questions);
}

export async function POST(request: Request) {
  const body = await request.json();

  const { rotation, subspecialty, question, answer } = body;

  if (!rotation || !subspecialty || !question || !answer) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  const newQuestion = await prisma.question.create({
    data: {
      rotation,
      subspecialty,
      question,
      answer,
    },
  });

  return NextResponse.json(newQuestion, { status: 201 });
}