"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  PlayCircle,
  Lock,
  Menu,
  X
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";

interface Lesson {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: number;
  isPublished: boolean;
  isFree: boolean;
  isCompleted: boolean;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}

interface Chapter {
  id: string;
  title: string;
  description?: string;
  isPublished: boolean;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  chapters: Chapter[];
  isEnrolled: boolean;
  isOwner: boolean;
}

export default function LearnPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.courseId as string;
  const lessonId = searchParams.get("lesson");
  
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  useEffect(() => {
    if (course && lessonId) {
      const lesson = findLessonById(lessonId);
      if (lesson) {
        setCurrentLesson(lesson);
      }
    } else if (course && !currentLesson) {
      // Auto-select first available lesson
      const firstLesson = getFirstAvailableLesson();
      if (firstLesson) {
        setCurrentLesson(firstLesson);
      }
    }
  }, [course, lessonId]);

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

  const findLessonById = (id: string): Lesson | null => {
    if (!course) return null;
    for (const chapter of course.chapters) {
      const lesson = chapter.lessons.find(l => l.id === id);
      if (lesson) return lesson;
    }
    return null;
  };

  const getFirstAvailableLesson = (): Lesson | null => {
    if (!course) return null;
    for (const chapter of course.chapters) {
      for (const lesson of chapter.lessons) {
        if (lesson.isPublished && (lesson.isFree || course.isEnrolled || course.isOwner)) {
          return lesson;
        }
      }
    }
    return null;
  };

  const markLessonComplete = async (lessonId: string, isCompleted: boolean) => {
    try {
      const lesson = findLessonById(lessonId);
      if (!lesson) return;

      const response = await fetch(
        `/api/lessons/${lessonId}/progress`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isCompleted }),
        }
      );

      if (response.ok) {
        // Update local state
        setCourse(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            chapters: prev.chapters.map(chapter => ({
              ...chapter,
              lessons: chapter.lessons.map(lesson => 
                lesson.id === lessonId 
                  ? { ...lesson, isCompleted }
                  : lesson
              ),
            })),
          };
        });

        if (isCompleted) {
          toast.success("Lesson completed!");
        }
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    }
  };

  const getNextLesson = (): Lesson | null => {
    if (!course || !currentLesson) return null;
    
    let foundCurrent = false;
    for (const chapter of course.chapters) {
      for (const lesson of chapter.lessons) {
        if (foundCurrent && lesson.isPublished && (lesson.isFree || course.isEnrolled || course.isOwner)) {
          return lesson;
        }
        if (lesson.id === currentLesson.id) {
          foundCurrent = true;
        }
      }
    }
    return null;
  };

  const getPreviousLesson = (): Lesson | null => {
    if (!course || !currentLesson) return null;
    
    let previousLesson: Lesson | null = null;
    for (const chapter of course.chapters) {
      for (const lesson of chapter.lessons) {
        if (lesson.id === currentLesson.id) {
          return previousLesson;
        }
        if (lesson.isPublished && (lesson.isFree || course.isEnrolled || course.isOwner)) {
          previousLesson = lesson;
        }
      }
    }
    return null;
  };

  const calculateProgress = (): number => {
    if (!course) return 0;
    
    const allLessons = course.chapters.flatMap(c => c.lessons.filter(l => l.isPublished));
    const completedLessons = allLessons.filter(l => l.isCompleted);
    
    return allLessons.length > 0 ? (completedLessons.length / allLessons.length) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-80 bg-muted animate-pulse"></div>
        <div className="flex-1 p-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <Link href="/courses" className="text-primary hover:underline">
          Browse courses
        </Link>
      </div>
    );
  }

  if (!course.isEnrolled && !course.isOwner) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          You need to enroll in this course to access the content.
        </p>
        <Link href={`/courses/${courseId}`} className="text-primary hover:underline">
          View course details
        </Link>
      </div>
    );
  }

  const progress = calculateProgress();
  const nextLesson = getNextLesson();
  const previousLesson = getPreviousLesson();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-80 bg-background border-r transition-transform duration-200 ease-in-out`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold truncate">{course.title}</h2>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {course.chapters.map((chapter) => (
            <div key={chapter.id} className="border-b">
              <div className="p-4">
                <h3 className="font-medium mb-2">{chapter.title}</h3>
                <div className="space-y-1">
                  {chapter.lessons.map((lesson) => {
                    const hasAccess = lesson.isFree || course.isEnrolled || course.isOwner;
                    const isActive = currentLesson?.id === lesson.id;
                    
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => hasAccess && setCurrentLesson(lesson)}
                        disabled={!hasAccess}
                        className={`w-full text-left p-2 rounded text-sm transition-colors ${
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : hasAccess 
                              ? 'hover:bg-muted' 
                              : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {lesson.isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : hasAccess ? (
                            <PlayCircle className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                          <span className="flex-1 truncate">{lesson.title}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              {currentLesson && (
                <div>
                  <h1 className="text-xl font-semibold">{currentLesson.title}</h1>
                  {currentLesson.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentLesson.description}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => previousLesson && setCurrentLesson(previousLesson)}
                disabled={!previousLesson}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => nextLesson && setCurrentLesson(nextLesson)}
                disabled={!nextLesson}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {currentLesson ? (
            <div className="space-y-6">
              {/* Video Player */}
              {currentLesson.videoUrl && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={currentLesson.videoUrl}
                    controls
                    className="w-full h-full"
                    onEnded={() => markLessonComplete(currentLesson.id, true)}
                  />
                </div>
              )}

              {/* Lesson Content */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{currentLesson.title}</CardTitle>
                    <Button
                      variant={currentLesson.isCompleted ? "secondary" : "default"}
                      size="sm"
                      onClick={() => markLessonComplete(currentLesson.id, !currentLesson.isCompleted)}
                    >
                      {currentLesson.isCompleted ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completed
                        </>
                      ) : (
                        "Mark Complete"
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {currentLesson.description && (
                    <p className="text-muted-foreground">{currentLesson.description}</p>
                  )}
                </CardContent>
              </Card>

              {/* Attachments */}
              {currentLesson.attachments && currentLesson.attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {currentLesson.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors"
                        >
                          <span className="flex-1">{attachment.name}</span>
                          <span className="text-sm text-muted-foreground">Download</span>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No lesson selected</h3>
              <p className="text-muted-foreground">
                Select a lesson from the sidebar to start learning
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
