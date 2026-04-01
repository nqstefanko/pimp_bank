import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const questionId = Number(id);

  if (Number.isNaN(questionId)) {
    return NextResponse.json({ error: "Invalid question id" }, { status: 400 });
  }

  const updatedQuestion = await prisma.question.update({
    where: { id: questionId },
    data: {
      voteCount: {
        increment: 1,
      },
    },
  });

  return NextResponse.json(updatedQuestion);
}