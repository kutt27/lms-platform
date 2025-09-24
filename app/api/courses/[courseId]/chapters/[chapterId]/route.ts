import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chapterSchema } from "@/lib/zodSchemas";

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

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
        courseId: courseId,
      },
      include: {
        lessons: {
          where: isOwner ? {} : { isPublished: true },
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
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    if (!isOwner && !chapter.isPublished) {
      return NextResponse.json({ error: "Chapter not available" }, { status: 403 });
    }

    return NextResponse.json({
      ...chapter,
      isOwner,
      isEnrolled,
    });
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const validatedData = chapterSchema.partial().parse(body);

    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: validatedData,
      include: {
        lessons: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    return NextResponse.json(updatedChapter);
  } catch (error) {
    console.error("Error updating chapter:", error);
    
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

export async function DELETE(
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

    await prisma.chapter.delete({
      where: { id: chapterId },
    });

    return NextResponse.json({ message: "Chapter deleted successfully" });
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
