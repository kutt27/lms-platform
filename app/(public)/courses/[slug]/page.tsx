"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Users,
  Clock,
  PlayCircle,
  CheckCircle,
  Lock,
  User,
  CreditCard
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  duration: number;
  level: string;
  category: string;
  smallDescription: string;
  requirements: string[];
  whatYouWillLearn: string[];
  user: {
    id: string;
    name: string;
    image?: string;
    bio?: string;
  };
  chapters: Array<{
    id: string;
    title: string;
    description?: string;
    isPublished: boolean;
    isFree: boolean;
    lessons: Array<{
      id: string;
      title: string;
      duration?: number;
      isPublished: boolean;
      isFree: boolean;
    }>;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment?: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
    createdAt: string;
  }>;
  _count: {
    enrollments: number;
    reviews: number;
  };
  isEnrolled: boolean;
  avgRating: number;
}

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (slug) {
      fetchCourse();
    }
  }, [slug]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      }
    } catch (error) {
      console.error("Error fetching course:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!session?.user) {
      toast.error("Please sign in to enroll");
      return;
    }

    if (!course) return;

    // For paid courses, redirect to purchase flow
    if (course.price && course.price > 0) {
      try {
        const response = await fetch(`/api/courses/${course.id}/purchase`, {
          method: "POST",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.paymentSession) {
            router.push(data.paymentSession.url);
            return;
          }
        }
      } catch (error) {
        console.error("Error creating payment session:", error);
        toast.error("Failed to initiate payment");
        return;
      }
    }

    // For free courses, enroll directly
    setEnrolling(true);
    try {
      const response = await fetch(`/api/courses/${course.id}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        toast.success("Successfully enrolled!");
        setCourse(prev => prev ? { ...prev, isEnrolled: true } : null);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to enroll");
      }
    } catch (error) {
      console.error("Error enrolling:", error);
      toast.error("Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <Link href="/courses" className="text-primary hover:underline">
          Browse all courses
        </Link>
      </div>
    );
  }

  const totalLessons = course.chapters.reduce(
    (acc, chapter) => acc + chapter.lessons.length,
    0
  );

  const freeLessons = course.chapters.reduce(
    (acc, chapter) => acc + chapter.lessons.filter(lesson => lesson.isFree).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative">
        {course.imageUrl && (
          <div className="relative h-64 w-full rounded-lg overflow-hidden">
            <Image
              src={course.imageUrl}
              alt={course.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}
        <div className={`${course.imageUrl ? 'absolute inset-0' : ''} flex items-center`}>
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="text-white border-white">
                  {course.level}
                </Badge>
                <Badge variant="secondary">{course.category}</Badge>
              </div>
              <h1 className={`text-4xl font-bold mb-4 ${course.imageUrl ? 'text-white' : ''}`}>
                {course.title}
              </h1>
              <p className={`text-lg mb-6 ${course.imageUrl ? 'text-white/90' : 'text-muted-foreground'}`}>
                {course.smallDescription}
              </p>
              <div className={`flex items-center gap-6 text-sm ${course.imageUrl ? 'text-white/80' : 'text-muted-foreground'}`}>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{course._count.enrollments} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration} hours</span>
                </div>
                {course.avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{course.avgRating} ({course._count.reviews} reviews)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About this course</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            </CardContent>
          </Card>

          {/* What you'll learn */}
          {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>What you&apos;ll learn</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {course.whatYouWillLearn.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {course.requirements && course.requirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {course.requirements.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Course Content */}
          <Card>
            <CardHeader>
              <CardTitle>Course content</CardTitle>
              <p className="text-sm text-muted-foreground">
                {course.chapters.length} chapters • {totalLessons} lessons
                {freeLessons > 0 && ` • ${freeLessons} free lessons`}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {course.chapters.map((chapter, index) => (
                  <div key={chapter.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{chapter.title}</h4>
                      <span className="text-sm text-muted-foreground">
                        {chapter.lessons.length} lessons
                      </span>
                    </div>
                    {chapter.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {chapter.description}
                      </p>
                    )}
                    <div className="space-y-2">
                      {chapter.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-2 text-sm">
                          {lesson.isFree ? (
                            <PlayCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="flex-1">{lesson.title}</span>
                          {lesson.duration && (
                            <span className="text-muted-foreground">
                              {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enrollment Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold mb-2">
                  {course.price === 0 ? "Free" : `$${course.price}`}
                </div>
                {course.price > 0 && (
                  <p className="text-sm text-muted-foreground">One-time payment</p>
                )}
              </div>

              {course.isEnrolled ? (
                <Button className="w-full" asChild>
                  <Link href={`/learn/${course.id}`}>
                    Continue Learning
                  </Link>
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? "Processing..." : (
                    course.price && course.price > 0 ? (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Buy Now - ${course.price}
                      </>
                    ) : (
                      "Enroll Now"
                    )
                  )}
                </Button>
              )}

              <Separator className="my-4" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{course.duration} hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Lessons:</span>
                  <span>{totalLessons}</span>
                </div>
                <div className="flex justify-between">
                  <span>Level:</span>
                  <span>{course.level}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span>{course.category}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructor */}
          <Card>
            <CardHeader>
              <CardTitle>Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                {course.user.image ? (
                  <Image
                    src={course.user.image}
                    alt={course.user.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h4 className="font-medium">{course.user.name}</h4>
                </div>
              </div>
              {course.user.bio && (
                <p className="text-sm text-muted-foreground">{course.user.bio}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
