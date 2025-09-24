import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser(request);
    requireAuth(user);

    const { courseId } = await context.params;

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        price: true,
        status: true,
        userId: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.status !== "Published") {
      return NextResponse.json(
        { error: "Course is not available for purchase" },
        { status: 400 }
      );
    }

    // Check if user is the course owner
    if (course.userId === user!.id) {
      return NextResponse.json(
        { error: "You cannot purchase your own course" },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user!.id,
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

    // For free courses, enroll directly
    if (!course.price || course.price === 0) {
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: user!.id,
          courseId: courseId,
        },
      });

      return NextResponse.json({
        success: true,
        enrollment,
        message: "Successfully enrolled in free course",
      });
    }

    // For paid courses, create a mock payment session
    // In a real implementation, this would integrate with Stripe
    const paymentSession = {
      id: `mock_session_${Date.now()}`,
      courseId: courseId,
      userId: user!.id,
      amount: course.price,
      currency: "usd",
      status: "pending",
      url: `/payment/checkout?session=${courseId}&user=${user!.id}`,
    };

    // Store payment session in database (you might want to create a PaymentSession model)
    // For now, we'll return the mock session
    return NextResponse.json({
      success: true,
      paymentSession,
      message: "Payment session created",
    });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
