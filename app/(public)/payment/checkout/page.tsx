"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  user: {
    name: string;
  };
}

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("session");
  const userId = searchParams.get("user");
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (courseId && session?.user) {
      fetchCourse();
    }
  }, [courseId, session]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      } else {
        toast.error("Course not found");
        router.push("/courses");
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!course || !session?.user) return;

    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create enrollment after successful payment
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentCompleted: true }),
      });

      if (response.ok) {
        toast.success("Payment successful! You are now enrolled in the course.");
        router.push(`/learn/${courseId}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to complete enrollment");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
        <p className="text-muted-foreground mb-4">
          You need to be signed in to purchase courses.
        </p>
        <Button asChild>
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Course not found</h2>
        <Button asChild>
          <Link href="/courses">Browse Courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${course.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Your Purchase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Course Summary */}
          <div className="flex gap-4">
            {course.imageUrl && (
              <Image
                src={course.imageUrl}
                alt={course.title}
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{course.title}</h3>
              <p className="text-sm text-muted-foreground">by {course.user.name}</p>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {course.description}
              </p>
            </div>
          </div>

          <Separator />

          {/* Price Summary */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Course Price</span>
              <span>${course.price}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span>$0.00</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${course.price}</span>
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-4">
            <h4 className="font-medium">Payment Method</h4>
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5" />
                <div>
                  <p className="font-medium">Mock Payment</p>
                  <p className="text-sm text-muted-foreground">
                    This is a demo payment system
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Secure Payment</p>
              <p className="text-sm text-blue-700">
                Your payment information is encrypted and secure.
              </p>
            </div>
          </div>

          {/* Demo Notice */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">Demo Mode</p>
              <p className="text-sm text-yellow-700">
                This is a demonstration. No real payment will be processed.
              </p>
            </div>
          </div>

          {/* Purchase Button */}
          <Button 
            onClick={handlePayment} 
            disabled={processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing Payment...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Purchase - ${course.price}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By completing this purchase, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}
