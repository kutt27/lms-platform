import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chapterSchema } from "@/lib/zodSchemas";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
): Promise<NextResponse> {
  try {
    const { courseId } = await context.params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if user has access to view chapters
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

    const chapters = await prisma.chapter.findMany({
      where: {
        courseId: courseId,
        ...whereClause,
      },
      include: {
        lessons: {
          where: isOwner ? {} : { isPublished: true },
          orderBy: {
            position: "asc",
          },
        },
      },
      orderBy: {
        position: "asc",
      },
    });

    return NextResponse.json({
      chapters,
      isOwner,
      isEnrolled,
    });
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
): Promise<NextResponse> {
  try {
    const { courseId } = await context.params;
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

    const body = await request.json();
    const validatedData = chapterSchema.parse(body);

    // Get the next position
    const lastChapter = await prisma.chapter.findFirst({
      where: { courseId },
      orderBy: { position: "desc" },
    });

    const position = lastChapter ? lastChapter.position + 1 : 0;

    const chapter = await prisma.chapter.create({
      data: {
        ...validatedData,
        courseId,
        position,
      },
      include: {
        lessons: true,
      },
    });

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    console.error("Error creating chapter:", error);
    
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
