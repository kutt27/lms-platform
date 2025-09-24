import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
): Promise<NextResponse> {
  try {
    const { courseId } = await context.params;
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentCompleted } = body;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.status !== "Published") {
      return NextResponse.json(
        { error: "Course is not published" },
        { status: 400 }
      );
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Already enrolled in this course" },
        { status: 400 }
      );
    }

    // For free courses (price = 0 or null), enroll directly
    if (!course.price || course.price === 0) {
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: courseId,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
            },
          },
        },
      });

      return NextResponse.json(enrollment, { status: 201 });
    }

    // For paid courses, check if payment was completed
    if (course.price > 0) {
      if (!paymentCompleted) {
        return NextResponse.json(
          {
            error: "Payment required",
            course: {
              id: course.id,
              title: course.title,
              price: course.price,
            },
          },
          { status: 402 }
        );
      }

      // Payment completed, create enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: courseId,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return NextResponse.json(enrollment, { status: 201 });
    }

    // This should not be reached, but adding for completeness
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error enrolling in course:", error);
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

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 404 }
      );
    }

    await prisma.enrollment.delete({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        },
      },
    });

    return NextResponse.json({ message: "Successfully unenrolled" });
  } catch (error) {
    console.error("Error unenrolling from course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
