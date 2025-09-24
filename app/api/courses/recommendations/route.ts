import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "6");

    let recommendedCourses: any[] = [];

    if (user) {
      // Get user's enrolled courses to understand preferences
      const userEnrollments = await prisma.enrollment.findMany({
        where: { userId: user.id },
        include: {
          course: {
            select: {
              category: true,
              level: true,
            },
          },
        },
      });

      const userCategories = [...new Set(userEnrollments.map(e => e.course.category))];
      const userLevels = [...new Set(userEnrollments.map(e => e.course.level))];

      if (userCategories.length > 0 || userLevels.length > 0) {
        // Recommend courses based on user's preferences
        recommendedCourses = await prisma.course.findMany({
          where: {
            status: "Published",
            NOT: {
              enrollments: {
                some: {
                  userId: user.id,
                },
              },
            },
            OR: [
              ...(userCategories.length > 0 ? [{ category: { in: userCategories } }] : []),
              ...(userLevels.length > 0 ? [{ level: { in: userLevels } }] : []),
            ],
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            _count: {
              select: {
                enrollments: true,
                reviews: true,
              },
            },
          },
          orderBy: [
            { enrollments: { _count: "desc" } },
            { createdAt: "desc" },
          ],
          take: limit,
        });
      }
    }

    // If no personalized recommendations or user not logged in, show popular courses
    if (!recommendedCourses || recommendedCourses.length < limit) {
      const popularCourses = await prisma.course.findMany({
        where: {
          status: "Published",
          ...(user ? {
            NOT: {
              enrollments: {
                some: {
                  userId: user.id,
                },
              },
            },
          } : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              reviews: true,
            },
          },
        },
        orderBy: [
          { enrollments: { _count: "desc" } },
          { createdAt: "desc" },
        ],
        take: limit,
      });

      // Combine personalized and popular recommendations
      const existingIds = new Set(recommendedCourses?.map(c => c.id) || []);
      const additionalCourses = popularCourses.filter(c => !existingIds.has(c.id));

      const currentLength = recommendedCourses?.length || 0;
      recommendedCourses = [
        ...(recommendedCourses || []),
        ...additionalCourses.slice(0, limit - currentLength),
      ];
    }

    // Calculate average ratings
    const coursesWithRatings = await Promise.all(
      recommendedCourses.map(async (course) => {
        const reviews = await prisma.review.findMany({
          where: { courseId: course.id },
          select: { rating: true },
        });

        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;

        return {
          ...course,
          avgRating: Math.round(avgRating * 10) / 10,
        };
      })
    );

    const response = NextResponse.json({
      courses: coursesWithRatings,
      type: user ? "personalized" : "popular",
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return response;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
