/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { 
  getCurrentUser, 
  canCreateCourse, 
  canEditCourse, 
  canAccessCourse,
  isEnrolledInCourse 
} from '@/lib/permissions';

// Mock Better Auth
jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
    },
  },
}));

describe('Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return user when session exists', async () => {
      const { auth } = require('@/lib/auth');
      const { prisma } = require('@/lib/db');
      
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
      };
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'INSTRUCTOR',
      };

      auth.api.getSession.mockResolvedValue({ data: mockSession });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/test');
      const user = await getCurrentUser(request);

      expect(user).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null when no session exists', async () => {
      const { auth } = require('@/lib/auth');
      
      auth.api.getSession.mockResolvedValue({ data: null });

      const request = new NextRequest('http://localhost:3000/test');
      const user = await getCurrentUser(request);

      expect(user).toBeNull();
    });
  });

  describe('canCreateCourse', () => {
    it('should return true for ADMIN users', () => {
      const adminUser = { id: '1', role: 'ADMIN' };
      expect(canCreateCourse(adminUser)).toBe(true);
    });

    it('should return true for INSTRUCTOR users', () => {
      const instructorUser = { id: '1', role: 'INSTRUCTOR' };
      expect(canCreateCourse(instructorUser)).toBe(true);
    });

    it('should return false for STUDENT users', () => {
      const studentUser = { id: '1', role: 'STUDENT' };
      expect(canCreateCourse(studentUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(canCreateCourse(null)).toBe(false);
    });
  });

  describe('canEditCourse', () => {
    it('should return true for ADMIN users', async () => {
      const { prisma } = require('@/lib/db');
      
      const adminUser = { id: '1', role: 'ADMIN' };
      const mockCourse = { id: '1', userId: '2' };
      
      prisma.course.findUnique.mockResolvedValue(mockCourse);

      const result = await canEditCourse(adminUser, '1');
      expect(result).toBe(true);
    });

    it('should return true for course owner', async () => {
      const { prisma } = require('@/lib/db');
      
      const instructorUser = { id: '1', role: 'INSTRUCTOR' };
      const mockCourse = { id: '1', userId: '1' };
      
      prisma.course.findUnique.mockResolvedValue(mockCourse);

      const result = await canEditCourse(instructorUser, '1');
      expect(result).toBe(true);
    });

    it('should return false for non-owner instructor', async () => {
      const { prisma } = require('@/lib/db');
      
      const instructorUser = { id: '1', role: 'INSTRUCTOR' };
      const mockCourse = { id: '1', userId: '2' };
      
      prisma.course.findUnique.mockResolvedValue(mockCourse);

      const result = await canEditCourse(instructorUser, '1');
      expect(result).toBe(false);
    });

    it('should return false when course does not exist', async () => {
      const { prisma } = require('@/lib/db');
      
      const instructorUser = { id: '1', role: 'INSTRUCTOR' };
      
      prisma.course.findUnique.mockResolvedValue(null);

      const result = await canEditCourse(instructorUser, '1');
      expect(result).toBe(false);
    });
  });

  describe('canAccessCourse', () => {
    it('should return true for published courses', async () => {
      const { prisma } = require('@/lib/db');
      
      const studentUser = { id: '1', role: 'STUDENT' };
      const mockCourse = { id: '1', status: 'Published', userId: '2' };
      
      prisma.course.findUnique.mockResolvedValue(mockCourse);

      const result = await canAccessCourse(studentUser, '1');
      expect(result).toBe(true);
    });

    it('should return true for course owner even if not published', async () => {
      const { prisma } = require('@/lib/db');
      
      const instructorUser = { id: '1', role: 'INSTRUCTOR' };
      const mockCourse = { id: '1', status: 'Draft', userId: '1' };
      
      prisma.course.findUnique.mockResolvedValue(mockCourse);

      const result = await canAccessCourse(instructorUser, '1');
      expect(result).toBe(true);
    });

    it('should return true for admin even if not published', async () => {
      const { prisma } = require('@/lib/db');
      
      const adminUser = { id: '1', role: 'ADMIN' };
      const mockCourse = { id: '1', status: 'Draft', userId: '2' };
      
      prisma.course.findUnique.mockResolvedValue(mockCourse);

      const result = await canAccessCourse(adminUser, '1');
      expect(result).toBe(true);
    });

    it('should return false for unpublished course by non-owner', async () => {
      const { prisma } = require('@/lib/db');
      
      const studentUser = { id: '1', role: 'STUDENT' };
      const mockCourse = { id: '1', status: 'Draft', userId: '2' };
      
      prisma.course.findUnique.mockResolvedValue(mockCourse);

      const result = await canAccessCourse(studentUser, '1');
      expect(result).toBe(false);
    });
  });

  describe('isEnrolledInCourse', () => {
    it('should return true when user is enrolled', async () => {
      const { prisma } = require('@/lib/db');
      
      const mockEnrollment = { id: '1', userId: '1', courseId: '1' };
      prisma.enrollment.findFirst.mockResolvedValue(mockEnrollment);

      const result = await isEnrolledInCourse('1', '1');
      expect(result).toBe(true);
      expect(prisma.enrollment.findFirst).toHaveBeenCalledWith({
        where: { userId: '1', courseId: '1' },
      });
    });

    it('should return false when user is not enrolled', async () => {
      const { prisma } = require('@/lib/db');
      
      prisma.enrollment.findFirst.mockResolvedValue(null);

      const result = await isEnrolledInCourse('1', '1');
      expect(result).toBe(false);
    });
  });
});
