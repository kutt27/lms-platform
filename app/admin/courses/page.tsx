import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { CoursesList } from "./_components/CoursesList";

export default function AdminIndexPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Courses</h1>
        <Link className={buttonVariants()} href="/admin/courses/create">
          Create Course
        </Link>
      </div>
      <CoursesList />
    </>
  );
}
