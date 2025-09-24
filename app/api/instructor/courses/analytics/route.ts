import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireInstructor } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    requireInstructor(user);

    const courses = await prisma.course.findMany({
      where: {
        userId: user!.id,
      },
      include: {
        enrollments: {
          include: {
            user: true,
          },
        },
        reviews: true,
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
                    isCompleted: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const coursesWithAnalytics = courses.map((course) => {
      // Calculate completion rate
      const allLessons = course.chapters.flatMap(chapter => chapter.lessons);
      const totalLessonsCount = allLessons.length;
      
      let totalCompletions = 0;
      const totalEnrollments = course.enrollments.length;

      if (totalEnrollments > 0 && totalLessonsCount > 0) {
        course.enrollments.forEach(enrollment => {
          const userCompletedLessons = allLessons.filter(lesson =>
            lesson.userProgress.some(progress => progress.userId === enrollment.userId)
          );
          totalCompletions += userCompletedLessons.length;
        });
      }

      const completionRate = totalEnrollments > 0 && totalLessonsCount > 0
        ? (totalCompletions / (totalEnrollments * totalLessonsCount)) * 100
        : 0;

      // Calculate average rating
      const averageRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
        : 0;

      // Calculate revenue (assuming free courses for now)
      const totalRevenue = course.price ? course.enrollments.length * course.price : 0;

      return {
        id: course.id,
        title: course.title,
        imageUrl: course.imageUrl,
        status: course.status,
        enrollmentCount: course.enrollments.length,
        completionRate,
        averageRating,
        totalRevenue,
        views: 0, // Views tracking to be implemented
        lastUpdated: course.updatedAt,
      };
    });

    return NextResponse.json({
      courses: coursesWithAnalytics,
    });
  } catch (error) {
    console.error("Error fetching course analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
