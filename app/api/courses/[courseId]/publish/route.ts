import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
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
      include: {
        chapters: {
          include: {
            lessons: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if course has required content to be published
    const hasPublishedChapter = course.chapters.some(chapter => chapter.isPublished);
    
    if (!hasPublishedChapter) {
      return NextResponse.json(
        { error: "Course must have at least one published chapter" },
        { status: 400 }
      );
    }

    const hasRequiredFields = course.title && 
                             course.description && 
                             course.imageUrl && 
                             course.category;

    if (!hasRequiredFields) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, image, and category" },
        { status: 400 }
      );
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: "Published",
      },
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error("Error publishing course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: "Draft",
      },
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error("Error unpublishing course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
