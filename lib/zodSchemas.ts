import { z } from "zod";

export const courseLevels = ["Beginner", "Intermediate", "Advanced"] as const;
export const courseStatus = ["Draft", "Published", "Archived"] as const;

export const courseCategories = [
  "Development",
  "Business",
  "Finance",
  "Health",
  "IT & Software",
  "Personal Development",
  "Design",
  "Marketing",
  "Office Productivity",
  "Music",
  "Teaching and Academics",
] as const;

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(100, { message: "Title must be atmost 100 words" }),
  description: z
    .string()
    .min(3, { message: "Description must be at least 3 characters long" }),
  imageUrl: z.string().url().optional(),
  price: z.number().min(0, { message: "Price must be a positive number" }),
  duration: z
    .number()
    .min(1, { message: "Duration must be atleast 1 hour" })
    .max(500, {
      message: "Maximum course length must be 500 hours, not more than that!",
    }),
  level: z.enum(courseLevels, { message: "Level is required" }),
  category: z.enum(courseCategories, { message: "Category is required" }),
  smallDescription: z
    .string()
    .min(3, { message: "Is should be atleast 3 characters" })
    .max(100, { message: "It should be maximum of 100 characters" }),
  status: z.enum(courseStatus, { message: "Status should be added" }),
  slug: z
    .string()
    .min(3, { message: "Slug must be added of atleast 3 characters." })
    .max(100),
  requirements: z.array(z.string()).optional(),
  whatYouWillLearn: z.array(z.string()).optional(),
});

export const chapterSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(100, { message: "Title must be at most 100 characters" }),
  description: z.string().optional(),
  position: z.number().min(0),
  isPublished: z.boolean().default(false),
  isFree: z.boolean().default(false),
});

export const lessonSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(100, { message: "Title must be at most 100 characters" }),
  description: z.string().optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().min(0).optional(),
  position: z.number().min(0),
  isPublished: z.boolean().default(false),
  isFree: z.boolean().default(false),
});

export const attachmentSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  url: z.string().url({ message: "Valid URL is required" }),
});

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5, { message: "Rating must be between 1 and 5" }),
  comment: z.string().optional(),
});

export type CourseSchemeType = z.infer<typeof courseSchema>;
export type ChapterSchemeType = z.infer<typeof chapterSchema>;
export type LessonSchemeType = z.infer<typeof lessonSchema>;
export type AttachmentSchemeType = z.infer<typeof attachmentSchema>;
export type ReviewSchemeType = z.infer<typeof reviewSchema>;
