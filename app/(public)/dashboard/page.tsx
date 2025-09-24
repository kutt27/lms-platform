"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  GraduationCap, 
  Clock, 
  Award,
  TrendingUp,
  PlayCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";

interface EnrolledCourse {
  id: string;
  course: {
    id: string;
    title: string;
    imageUrl?: string;
    slug: string;
    user: {
      name: string;
    };
  };
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessed?: string;
}

interface Certificate {
  id: string;
  courseId: string;
  issuedAt: string;
  course: {
    title: string;
    imageUrl?: string;
  };
}

interface DashboardStats {
  totalEnrollments: number;
  completedCourses: number;
  totalCertificates: number;
  totalLearningHours: number;
}

export default function DashboardPage() {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEnrollments: 0,
    completedCourses: 0,
    totalCertificates: 0,
    totalLearningHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const [enrollmentsRes, certificatesRes, statsRes] = await Promise.all([
        fetch("/api/user/enrollments"),
        fetch("/api/user/certificates"),
        fetch("/api/user/stats"),
      ]);

      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json();
        setEnrolledCourses(enrollmentsData.enrollments || []);
      }

      if (certificatesRes.ok) {
        const certificatesData = await certificatesRes.json();
        setCertificates(certificatesData.certificates || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
        <p className="text-muted-foreground">
          You need to be signed in to view your dashboard.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-8 w-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 w-16 bg-gray-200 rounded mb-1"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Learning Dashboard
              </h1>
              <p className="text-muted-foreground text-lg mt-1">
                Track your learning progress and achievements
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.totalEnrollments}</p>
                  <p className="text-sm font-medium text-blue-600/70 dark:text-blue-400/70">Enrolled Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.completedCourses}</p>
                  <p className="text-sm font-medium text-green-600/70 dark:text-green-400/70">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/50 dark:to-yellow-900/30 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{stats.totalCertificates}</p>
                  <p className="text-sm font-medium text-yellow-600/70 dark:text-yellow-400/70">Certificates</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.totalLearningHours}</p>
                  <p className="text-sm font-medium text-purple-600/70 dark:text-purple-400/70">Learning Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrolled Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Continue Learning
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrolledCourses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No enrolled courses yet</p>
                <Button asChild>
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {enrolledCourses.slice(0, 5).map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center gap-4 p-3 rounded-lg border">
                    {enrollment.course.imageUrl && (
                      <Image
                        src={enrollment.course.imageUrl}
                        alt={enrollment.course.title}
                        width={60}
                        height={60}
                        className="rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{enrollment.course.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        by {enrollment.course.user.name}
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{Math.round(enrollment.progress)}%</span>
                        </div>
                        <Progress value={enrollment.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {enrollment.completedLessons} of {enrollment.totalLessons} lessons
                        </p>
                      </div>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/learn/${enrollment.course.id}`}>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Continue
                      </Link>
                    </Button>
                  </div>
                ))}
                {enrolledCourses.length > 5 && (
                  <div className="text-center">
                    <Button variant="outline" asChild>
                      <Link href="/my-courses">View All Courses</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certificates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {certificates.length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No certificates yet</p>
                <p className="text-sm text-muted-foreground">
                  Complete courses to earn certificates
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {certificates.slice(0, 3).map((certificate) => (
                  <div key={certificate.id} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Award className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{certificate.course.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Earned on {new Date(certificate.issuedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">Certified</Badge>
                  </div>
                ))}
                {certificates.length > 3 && (
                  <div className="text-center">
                    <Button variant="outline" asChild>
                      <Link href="/certificates">View All Certificates</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
