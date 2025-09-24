"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  level: string;
  category: string;
  slug: string;
  smallDescription: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  _count: {
    enrollments: number;
    reviews: number;
  };
  avgRating?: number;
}

interface RecommendationsResponse {
  courses: Course[];
  type: "personalized" | "popular";
}

export function RecommendedCourses() {
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    fetchRecommendations();
  }, [session]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch("/api/courses/recommendations?limit=6");
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!recommendations || recommendations.courses.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {recommendations.type === "personalized" ? "Recommended for You" : "Popular Courses"}
            </h2>
            <p className="text-muted-foreground">
              {recommendations.type === "personalized" 
                ? "Based on your learning preferences and enrolled courses"
                : "Discover what other learners are taking"
              }
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/courses" className="flex items-center gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.courses.map((course) => (
            <Card key={course.id} className="group hover:shadow-lg transition-shadow">
              <Link href={`/courses/${course.slug}`}>
                <div className="relative">
                  {course.imageUrl ? (
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      width={400}
                      height={200}
                      className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">
                        {course.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-white/90 text-black">
                      {course.price === 0 ? "Free" : `$${course.price}`}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">
                        {course.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{course.level}</Badge>
                        <Badge variant="secondary">{course.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.smallDescription}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course._count.enrollments}</span>
                      </div>
                      {course.avgRating && course.avgRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{course.avgRating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {course.user.image && (
                        <Image
                          src={course.user.image}
                          alt={course.user.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {course.user.name}
                      </span>
                    </div>
                    {recommendations.type === "personalized" && (
                      <Badge variant="outline" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
