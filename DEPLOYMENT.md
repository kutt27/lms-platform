# 🚀 Production Deployment Guide

This guide covers various deployment options for the LMS Platform.

## 📋 Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Database setup and migrations run
- [ ] Build passes without errors
- [ ] Tests are passing
- [ ] Security headers configured
- [ ] SSL certificates ready (for production)
- [ ] Domain name configured
- [ ] Email service configured
- [ ] OAuth apps configured for production URLs

## 🌐 Deployment Options

### 1. Vercel (Recommended)

Vercel provides the easiest deployment for Next.js applications.

#### Steps:

1. **Connect Repository**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

3. **Environment Variables**
   Add these in Vercel dashboard:
   ```
   DATABASE_URL=your-production-database-url
   BETTER_AUTH_SECRET=your-production-secret
   BETTER_AUTH_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_BETTER_AUTH_URL=https://your-domain.vercel.app
   AUTH_GITHUB_CLIENT_ID=your-github-client-id
   AUTH_GITHUB_SECRET=your-github-secret
   RESEND_API_KEY=your-resend-api-key
   ARCJET_KEY=your-arcjet-key
   ```

4. **Database Setup**
   - Use Neon, Supabase, or PlanetScale for PostgreSQL
   - Run migrations: `npx prisma db push`

### 2. Railway

Railway offers simple deployment with built-in PostgreSQL.

#### Steps:

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub repo

2. **Add PostgreSQL**
   - Add PostgreSQL service
   - Copy DATABASE_URL from Railway dashboard

3. **Configure Environment Variables**
   - Add all required environment variables
   - Update BETTER_AUTH_URL to your Railway domain

4. **Deploy**
   - Railway automatically builds and deploys

### 3. Docker Deployment

Use Docker for containerized deployment on any platform.

#### Steps:

1. **Build Docker Image**
   ```bash
   docker build -t lms-platform .
   ```

2. **Run with Docker Compose**
   ```bash
   # Update environment variables in docker-compose.yml
   docker-compose up -d
   ```

3. **Or run manually**
   ```bash
   # Start PostgreSQL
   docker run -d --name postgres \
     -e POSTGRES_DB=lms_db \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=password \
     -p 5432:5432 \
     postgres:15-alpine

   # Run the application
   docker run -d --name lms-app \
     -p 3000:3000 \
     --link postgres:postgres \
     -e DATABASE_URL=postgresql://postgres:password@postgres:5432/lms_db \
     lms-platform
   ```

### 4. VPS/Server Deployment

Deploy on your own server using PM2.

#### Steps:

1. **Server Setup**
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   npm install -g pm2

   # Install PostgreSQL
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Application Setup**
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd lms-platform

   # Install dependencies
   npm ci --only=production

   # Build application
   npm run build

   # Setup database
   npx prisma generate
   npx prisma db push
   ```

3. **Start with PM2**
   ```bash
   # Create ecosystem file
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'lms-platform',
       script: 'npm',
       args: 'start',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   }
   EOF

   # Start application
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

## 🔒 Security Considerations

### 1. Environment Variables
- Use strong, unique secrets
- Never commit .env files
- Use different secrets for each environment

### 2. Database Security
- Use connection pooling
- Enable SSL connections
- Regular backups
- Restrict database access

### 3. Application Security
- Enable HTTPS
- Configure security headers
- Use rate limiting
- Regular security updates

### 4. OAuth Configuration
- Update OAuth app URLs for production
- Use HTTPS callback URLs
- Restrict OAuth app access

## 📊 Monitoring & Analytics

### 1. Application Monitoring
- Use Sentry for error tracking
- Monitor performance with Vercel Analytics
- Set up uptime monitoring

### 2. Database Monitoring
- Monitor connection pool usage
- Track query performance
- Set up backup monitoring

### 3. User Analytics
- Google Analytics integration
- User behavior tracking
- Course completion analytics

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check TypeScript errors
   - Verify environment variables
   - Check dependency versions

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure database exists

3. **Authentication Issues**
   - Verify OAuth app configuration
   - Check callback URLs
   - Ensure BETTER_AUTH_URL is correct

4. **Performance Issues**
   - Enable caching
   - Optimize images
   - Use CDN for static assets

### Logs and Debugging

```bash
# View application logs
pm2 logs lms-platform

# Check database connections
npx prisma db pull

# Test build locally
npm run build
npm start
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review application logs
3. Check environment variables
4. Verify database connectivity

---

**Note**: Always test your deployment in a staging environment before going to production.
