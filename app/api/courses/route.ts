import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { courseSchema } from "@/lib/zodSchemas";
import { getCurrentUser, canCreateCourse } from "@/lib/permissions";
import slugify from "slugify";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const level = searchParams.get("level");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "newest";
    const priceFilter = searchParams.get("priceFilter");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const where: any = {
      status: "Published",
    };

    if (category) {
      where.category = category;
    }

    if (level) {
      where.level = level;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { smallDescription: { contains: search, mode: "insensitive" } },
      ];
    }

    // Price filtering
    if (priceFilter) {
      switch (priceFilter) {
        case "free":
          where.OR = [
            { price: 0 },
            { price: null }
          ];
          break;
        case "paid":
          where.price = { gt: 0 };
          break;
        case "under50":
          where.price = { gt: 0, lt: 50 };
          break;
        case "50to100":
          where.price = { gte: 50, lte: 100 };
          break;
        case "over100":
          where.price = { gt: 100 };
          break;
      }
    }

    // Sorting
    let orderBy: any = { createdAt: "desc" }; // default newest
    switch (sortBy) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "popular":
        orderBy = { enrollments: { _count: "desc" } };
        break;
      case "rating":
        orderBy = { reviews: { _count: "desc" } };
        break;
      case "price_low":
        orderBy = { price: "asc" };
        break;
      case "price_high":
        orderBy = { price: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
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
        orderBy,
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    const response = NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      totalPages: Math.ceil(total / limit),
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    return response;
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!await canCreateCourse(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = courseSchema.parse(body);

    // Generate slug from title if not provided
    if (!validatedData.slug) {
      validatedData.slug = slugify(validatedData.title, {
        lower: true,
        strict: true,
      });
    }

    // Check if slug already exists
    const existingCourse = await prisma.course.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingCourse) {
      // Append timestamp to make slug unique
      validatedData.slug = `${validatedData.slug}-${Date.now()}`;
    }

    const course = await prisma.course.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
