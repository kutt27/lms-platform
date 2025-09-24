import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    requireAuth(user);

    // Get total enrollments
    const totalEnrollments = await prisma.enrollment.count({
      where: {
        userId: user!.id,
      },
    });

    // Get total certificates (completed courses)
    const totalCertificates = await prisma.certificate.count({
      where: {
        userId: user!.id,
      },
    });

    // Get completed courses count
    const enrollmentsWithProgress = await prisma.enrollment.findMany({
      where: {
        userId: user!.id,
      },
      include: {
        course: {
          include: {
            chapters: {
              where: {
                isPublished: true,
              },
              include: {
                lessons: {
                  where: {
                    isPublished: true,
                  },
                  include: {
                    userProgress: {
                      where: {
                        userId: user!.id,
                        isCompleted: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    let completedCourses = 0;
    let totalLearningHours = 0;

    enrollmentsWithProgress.forEach((enrollment) => {
      const allLessons = enrollment.course.chapters.flatMap(chapter => chapter.lessons);
      const completedLessons = allLessons.filter(lesson => 
        lesson.userProgress.length > 0
      );
      
      // If all lessons are completed, course is completed
      if (allLessons.length > 0 && completedLessons.length === allLessons.length) {
        completedCourses++;
      }

      // Calculate learning hours (estimate based on lesson duration)
      completedLessons.forEach(lesson => {
        totalLearningHours += lesson.duration || 10; // Default 10 minutes per lesson
      });
    });

    // Convert minutes to hours
    totalLearningHours = Math.round(totalLearningHours / 60);

    return NextResponse.json({
      totalEnrollments,
      completedCourses,
      totalCertificates,
      totalLearningHours,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
