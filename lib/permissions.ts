import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export type UserRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
}

export async function getCurrentUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });

    return user as AuthenticatedUser;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export function hasRole(user: AuthenticatedUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function isAdmin(user: AuthenticatedUser | null): boolean {
  return hasRole(user, ["ADMIN"]);
}

export function isInstructor(user: AuthenticatedUser | null): boolean {
  return hasRole(user, ["INSTRUCTOR", "ADMIN"]);
}

export function isStudent(user: AuthenticatedUser | null): boolean {
  return hasRole(user, ["STUDENT", "INSTRUCTOR", "ADMIN"]);
}

export async function canAccessCourse(
  user: AuthenticatedUser | null,
  courseId: string
): Promise<boolean> {
  if (!user) return false;

  // Admins can access any course
  if (isAdmin(user)) return true;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      userId: true,
      status: true,
    },
  });

  if (!course) return false;

  // Course owner can access
  if (course.userId === user.id) return true;

  // Only published courses can be accessed by non-owners
  if (course.status !== "Published") return false;

  // Check if user is enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId,
      },
    },
  });

  return !!enrollment;
}

export async function canEditCourse(
  user: AuthenticatedUser | null,
  courseId: string
): Promise<boolean> {
  if (!user) return false;

  // Admins can edit any course
  if (isAdmin(user)) return true;

  // Only instructors can edit courses
  if (!isInstructor(user)) return false;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      userId: true,
    },
  });

  if (!course) return false;

  // Course owner can edit
  return course.userId === user.id;
}

export async function canCreateCourse(user: AuthenticatedUser | null): Promise<boolean> {
  if (!user) return false;
  return isInstructor(user);
}

export async function canEnrollInCourse(
  user: AuthenticatedUser | null,
  courseId: string
): Promise<boolean> {
  if (!user) return false;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      userId: true,
      status: true,
    },
  });

  if (!course) return false;

  // Can't enroll in your own course
  if (course.userId === user.id) return false;

  // Can only enroll in published courses
  if (course.status !== "Published") return false;

  // Check if already enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId,
      },
    },
  });

  // Can't enroll if already enrolled
  return !enrollment;
}

export function requireAuth(user: AuthenticatedUser | null): AuthenticatedUser {
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export function requireRole(user: AuthenticatedUser | null, roles: UserRole[]): AuthenticatedUser {
  const authenticatedUser = requireAuth(user);
  if (!hasRole(authenticatedUser, roles)) {
    throw new Error(`Access denied. Required roles: ${roles.join(", ")}`);
  }
  return authenticatedUser;
}

export function requireInstructor(user: AuthenticatedUser | null): AuthenticatedUser {
  return requireRole(user, ["INSTRUCTOR", "ADMIN"]);
}

export function requireAdmin(user: AuthenticatedUser | null): AuthenticatedUser {
  return requireRole(user, ["ADMIN"]);
}
