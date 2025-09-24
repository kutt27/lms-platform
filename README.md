# Learning Management System (LMS) Platform

A comprehensive Learning Management System built with Next.js 15, featuring course creation, student enrollment, progress tracking, and more.

## 🚀 Features

### For Students
- **Course Discovery**: Browse and search courses with advanced filtering
- **Enrollment System**: Enroll in free or paid courses
- **Learning Interface**: Interactive video player with progress tracking
- **Dashboard**: Personal learning dashboard with progress analytics
- **Certificates**: Automatic certificate generation upon course completion
- **Recommendations**: Personalized course recommendations

### For Instructors
- **Course Creation**: Rich course creation with chapters and lessons
- **Content Management**: Upload videos, images, and documents
- **Student Analytics**: Track student progress and engagement
- **Revenue Tracking**: Monitor course sales and earnings
- **Media Library**: Centralized file management system

### For Administrators
- **User Management**: Manage users and roles
- **Platform Analytics**: Comprehensive platform statistics
- **Course Moderation**: Review and approve courses
- **System Configuration**: Platform-wide settings

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with GitHub OAuth and Email OTP
- **Styling**: TailwindCSS with Radix UI components
- **Forms**: React Hook Form with Zod validation
- **Rich Text**: TipTap editor
- **Drag & Drop**: DnD Kit for reordering
- **Testing**: Jest with React Testing Library
- **Deployment**: Vercel-ready

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lms-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables (see `.env.example` for complete list):
   ```env
   DATABASE_URL="postgresql://..."
   BETTER_AUTH_SECRET="your-secret-key"
   AUTH_GITHUB_CLIENT_ID="your-github-client-id"
   AUTH_GITHUB_SECRET="your-github-client-secret"
   BETTER_AUTH_URL="http://localhost:3001"
   RESEND_API_KEY="your-resend-api-key"
   ARCJET_KEY="your-arcjet-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗃️ Database Schema

The platform uses the following main models:

- **User**: User accounts with roles (STUDENT, INSTRUCTOR, ADMIN)
- **Course**: Course information with status and pricing
- **Chapter**: Course chapters for organization
- **Lesson**: Individual lessons with content
- **Enrollment**: Student course enrollments
- **Progress**: Lesson completion tracking
- **Review**: Course reviews and ratings
- **Certificate**: Generated completion certificates

## 🔐 Authentication

The platform uses Better Auth for authentication with support for:

- **GitHub OAuth**: Social login with GitHub
- **Email OTP**: Passwordless email authentication
- **Role-based Access**: Different permissions for students, instructors, and admins

## 🎨 UI Components

Built with a comprehensive design system:

- **Radix UI**: Accessible component primitives
- **TailwindCSS**: Utility-first styling
- **Custom Components**: Reusable UI components
- **Dark Mode**: Built-in theme switching
- **Responsive Design**: Mobile-first approach

## 🧪 Testing

Run tests with:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── (public)/          # Public routes
│   ├── admin/             # Admin dashboard
│   └── api/               # API routes
├── components/            # Reusable components
├── lib/                   # Utility functions
├── prisma/               # Database schema
├── __tests__/            # Test files
└── public/               # Static assets
```

## 🚀 Deployment

The application is ready for deployment on Vercel:

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Set environment variables**
4. **Deploy**

For other platforms, build the application:

```bash
npm run build
npm start
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `BETTER_AUTH_SECRET` | Secret key for authentication | Yes |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | Yes |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | Yes |
| `BETTER_AUTH_URL` | Base URL for auth callbacks | Yes |

### Database Setup

The platform uses PostgreSQL. You can use:

- **Local PostgreSQL**: Install locally
- **Docker**: Use docker-compose
- **Cloud Services**: Supabase, Neon, PlanetScale

## 📈 Features Roadmap

- [ ] Real-time chat and discussions
- [ ] Assignment and quiz system
- [ ] Video conferencing integration
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Payment gateway integration (Stripe)
- [ ] Email notifications
- [ ] Course marketplace
- [ ] API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review existing issues

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Radix UI for accessible components
- Prisma for the excellent ORM
- Better Auth for authentication
- All contributors and users

---

Built with ❤️ using Next.js 15
