import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireInstructor } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    requireInstructor(user);

    // Get total courses
    const totalCourses = await prisma.course.count({
      where: {
        userId: user!.id,
      },
    });

    // Get total students (unique enrollments)
    const totalStudents = await prisma.enrollment.count({
      where: {
        course: {
          userId: user!.id,
        },
      },
    });

    // Get courses with detailed data for calculations
    const coursesWithData = await prisma.course.findMany({
      where: {
        userId: user!.id,
      },
      include: {
        enrollments: true,
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
      },
    });

    // Calculate total revenue
    let totalRevenue = 0;
    let totalRatings = 0;
    let ratingSum = 0;
    let totalViews = 0;
    let totalCompletions = 0;
    let totalPossibleCompletions = 0;

    coursesWithData.forEach((course) => {
      // Revenue calculation
      if (course.price) {
        totalRevenue += course.enrollments.length * course.price;
      }

      // Rating calculation
      course.reviews.forEach((review) => {
        ratingSum += review.rating;
        totalRatings++;
      });

      // Views (to be implemented)
      totalViews += 0;

      // Completion rate calculation
      const allLessons = course.chapters.flatMap(chapter => chapter.lessons);
      const totalLessonsCount = allLessons.length;
      
      if (course.enrollments.length > 0 && totalLessonsCount > 0) {
        totalPossibleCompletions += course.enrollments.length * totalLessonsCount;
        
        course.enrollments.forEach(enrollment => {
          const userCompletedLessons = allLessons.filter(lesson =>
            lesson.userProgress.some(progress => progress.userId === enrollment.userId)
          );
          totalCompletions += userCompletedLessons.length;
        });
      }
    });

    const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0;
    const completionRate = totalPossibleCompletions > 0 
      ? (totalCompletions / totalPossibleCompletions) * 100 
      : 0;

    return NextResponse.json({
      totalCourses,
      totalStudents,
      totalRevenue,
      averageRating,
      totalViews,
      completionRate,
    });
  } catch (error) {
    console.error("Error fetching instructor stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
