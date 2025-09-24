import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    requireAuth(user);

    const certificates = await prisma.certificate.findMany({
      where: {
        userId: user!.id,
      },
      orderBy: {
        issuedAt: "desc",
      },
    });

    // Fetch course data separately
    const certificatesWithCourses = await Promise.all(
      certificates.map(async (certificate) => {
        const course = await prisma.course.findUnique({
          where: { id: certificate.courseId },
          select: {
            id: true,
            title: true,
            imageUrl: true,
            slug: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        });
        return {
          ...certificate,
          course,
        };
      })
    );

    return NextResponse.json({
      certificates: certificatesWithCourses,
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
