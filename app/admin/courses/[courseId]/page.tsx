"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { CourseEditForm } from "./_components/CourseEditForm";
import { ChaptersList } from "./_components/ChaptersList";

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  level: string;
  category: string;
  status: string;
  slug: string;
  smallDescription: string;
  requirements: string[];
  whatYouWillLearn: string[];
  chapters: any[];
  _count: {
    enrollments: number;
    reviews: number;
  };
}

export default function CourseEditPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
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

  const handleCourseUpdate = (updatedCourse: Omit<Course, 'chapters' | '_count'>) => {
    setCourse(prev => prev ? { ...prev, ...updatedCourse } : null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <Link href="/admin/courses" className={buttonVariants()}>
          Back to Courses
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-green-100 text-green-800";
      case "Draft":
        return "bg-yellow-100 text-yellow-800";
      case "Archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/courses"
          className={buttonVariants({
            variant: "outline",
            size: "icon",
          })}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getStatusColor(course.status)}>
              {course.status}
            </Badge>
            <Badge variant="outline">{course.level}</Badge>
            <span className="text-sm text-muted-foreground">
              {course._count.enrollments} students enrolled
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/courses/${course.slug}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Preview
          </Link>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent>
              <CourseEditForm
                course={{
                  id: course.id,
                  title: course.title,
                  description: course.description,
                  imageUrl: course.imageUrl,
                  price: course.price,
                  level: course.level,
                  category: course.category,
                  status: course.status,
                  slug: course.slug,
                  smallDescription: course.smallDescription,
                  requirements: course.requirements,
                  whatYouWillLearn: course.whatYouWillLearn,
                }}
                onUpdate={handleCourseUpdate}
              />
            </CardContent>
          </Card>
        </div>

        {/* Chapters */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Course Content</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Chapter
              </Button>
            </CardHeader>
            <CardContent>
              <ChaptersList courseId={courseId} chapters={course.chapters} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
