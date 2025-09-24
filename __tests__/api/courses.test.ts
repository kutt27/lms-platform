/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/courses/route';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    course: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock('@/lib/permissions', () => ({
  getCurrentUser: jest.fn(),
  canCreateCourse: jest.fn(),
}));

describe('/api/courses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/courses', () => {
    it('should return courses with pagination', async () => {
      const { prisma } = require('@/lib/db');
      
      const mockCourses = [
        {
          id: '1',
          title: 'Test Course',
          description: 'Test Description',
          status: 'Published',
          user: { id: '1', name: 'Test User' },
          _count: { enrollments: 5, reviews: 2 },
        },
      ];

      prisma.course.findMany.mockResolvedValue(mockCourses);
      prisma.course.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/courses?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.courses).toEqual(mockCourses);
      expect(data.pagination.total).toBe(1);
      expect(data.totalPages).toBe(1);
    });

    it('should filter courses by search term', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.course.findMany.mockResolvedValue([]);
      prisma.course.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/courses?search=javascript');
      await GET(request);

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'javascript', mode: 'insensitive' } },
              { description: { contains: 'javascript', mode: 'insensitive' } },
              { smallDescription: { contains: 'javascript', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should filter courses by category', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.course.findMany.mockResolvedValue([]);
      prisma.course.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/courses?category=Development');
      await GET(request);

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'Development',
          }),
        })
      );
    });

    it('should sort courses by popularity', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.course.findMany.mockResolvedValue([]);
      prisma.course.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/courses?sortBy=popular');
      await GET(request);

      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { enrollments: { _count: 'desc' } },
        })
      );
    });
  });

  describe('POST /api/courses', () => {
    it('should create a course when user is authorized', async () => {
      const { getCurrentUser, canCreateCourse } = require('@/lib/permissions');
      const { prisma } = require('@/lib/db');

      const mockUser = { id: '1', name: 'Test User', role: 'INSTRUCTOR' };
      const mockCourse = {
        id: '1',
        title: 'New Course',
        slug: 'new-course',
        description: 'Course description',
        userId: '1',
      };

      getCurrentUser.mockResolvedValue(mockUser);
      canCreateCourse.mockResolvedValue(true);
      prisma.course.create.mockResolvedValue(mockCourse);

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Course',
          description: 'Course description',
          category: 'Development',
          level: 'Beginner',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockCourse);
      expect(prisma.course.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Course',
            userId: '1',
          }),
        })
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      const { getCurrentUser } = require('@/lib/permissions');
      
      getCurrentUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Course',
          description: 'Course description',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 when user cannot create courses', async () => {
      const { getCurrentUser, canCreateCourse } = require('@/lib/permissions');
      
      const mockUser = { id: '1', name: 'Test User', role: 'STUDENT' };
      getCurrentUser.mockResolvedValue(mockUser);
      canCreateCourse.mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Course',
          description: 'Course description',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });
  });
});
