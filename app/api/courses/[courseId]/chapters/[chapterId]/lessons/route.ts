import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lessonSchema } from "@/lib/zodSchemas";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string; chapterId: string }> }
): Promise<NextResponse> {
  try {
    const { courseId, chapterId } = await context.params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
        courseId: courseId,
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const isOwner = session?.user?.id === course.userId;
    let isEnrolled = false;

    if (session?.user && !isOwner) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: courseId,
          },
        },
      });
      isEnrolled = !!enrollment;
    }

    const whereClause = isOwner ? {} : { isPublished: true };

    const lessons = await prisma.lesson.findMany({
      where: {
        chapterId: chapterId,
        ...whereClause,
      },
      include: {
        attachments: true,
        userProgress: session?.user ? {
          where: {
            userId: session.user.id,
          },
        } : false,
      },
      orderBy: {
        position: "asc",
      },
    });

    return NextResponse.json({
      lessons,
      isOwner,
      isEnrolled,
    });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string; chapterId: string }> }
): Promise<NextResponse> {
  try {
    const { courseId, chapterId } = await context.params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
        courseId: courseId,
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = lessonSchema.parse(body);

    // Get the next position
    const lastLesson = await prisma.lesson.findFirst({
      where: { chapterId },
      orderBy: { position: "desc" },
    });

    const position = lastLesson ? lastLesson.position + 1 : 0;

    const lesson = await prisma.lesson.create({
      data: {
        ...validatedData,
        chapterId,
        position,
      },
      include: {
        attachments: true,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
