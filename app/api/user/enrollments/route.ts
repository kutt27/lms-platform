import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    requireAuth(user);

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: user!.id,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            slug: true,
            duration: true,
            user: {
              select: {
                name: true,
              },
            },
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
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate progress for each enrollment
    const enrollmentsWithProgress = enrollments.map((enrollment) => {
      const allLessons = enrollment.course.chapters.flatMap(chapter => chapter.lessons);
      const completedLessons = allLessons.filter(lesson => 
        lesson.userProgress.some(progress => progress.isCompleted)
      );
      
      const progress = allLessons.length > 0 
        ? (completedLessons.length / allLessons.length) * 100 
        : 0;

      return {
        id: enrollment.id,
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          imageUrl: enrollment.course.imageUrl,
          slug: enrollment.course.slug,
          user: enrollment.course.user,
        },
        progress: Math.round(progress),
        completedLessons: completedLessons.length,
        totalLessons: allLessons.length,
        enrolledAt: enrollment.createdAt,
      };
    });

    return NextResponse.json({
      enrollments: enrollmentsWithProgress,
    });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
