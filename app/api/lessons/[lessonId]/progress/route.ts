import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ lessonId: string }> }
): Promise<NextResponse> {
  try {
    const { lessonId } = await context.params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { isCompleted } = body;

    if (typeof isCompleted !== "boolean") {
      return NextResponse.json(
        { error: "isCompleted must be a boolean" },
        { status: 400 }
      );
    }

    // Verify the lesson exists and user has access
    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
      },
      include: {
        chapter: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: lesson.chapter.course.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Update or create progress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: lessonId,
        },
      },
      update: {
        isCompleted,
      },
      create: {
        userId: session.user.id,
        lessonId: lessonId,
        isCompleted,
      },
    });

    // If lesson is completed, check if all lessons in the course are completed
    if (isCompleted) {
      const allLessons = await prisma.lesson.findMany({
        where: {
          chapter: {
            courseId: lesson.chapter.course.id,
            isPublished: true,
          },
          isPublished: true,
        },
        include: {
          userProgress: {
            where: {
              userId: session.user.id,
            },
          },
        },
      });

      const completedLessons = allLessons.filter(
        (lesson) => lesson.userProgress.length > 0 && lesson.userProgress[0].isCompleted
      );

      // If all lessons are completed, issue a certificate
      if (completedLessons.length === allLessons.length) {
        const existingCertificate = await prisma.certificate.findUnique({
          where: {
            userId_courseId: {
              userId: session.user.id,
              courseId: lesson.chapter.course.id,
            },
          },
        });

        if (!existingCertificate) {
          await prisma.certificate.create({
            data: {
              userId: session.user.id,
              courseId: lesson.chapter.course.id,
              issuedAt: new Date(),
            },
          });
        }
      }
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error updating lesson progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
