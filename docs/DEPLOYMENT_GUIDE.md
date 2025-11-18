# Code2027 - Deployment Guide

**Version:** 1.0
**Last Updated:** November 18, 2025
**Target:** Production Deployment

---

## Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: 2.x or higher
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Development Tools
- **TypeScript**: 5.x (included in dependencies)
- **Vite**: 4.x (included in dependencies)
- **Vitest**: 0.34+ (for testing)

---

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/tomaszsb/Code2027.git
cd Code2027
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Verify Installation
```bash
# Check that all dependencies are installed
npm list --depth=0

# Run type checking
npx tsc --noEmit

# Run tests
npm test
```

### 4. Start Development Server
```bash
npm run dev
```

The game will be available at `http://localhost:5173`

---

## Build for Production

### 1. Run Pre-Build Checks
```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# All tests
npm test

# Ensure all pass before proceeding
```

### 2. Create Production Build
```bash
# Set environment to production
export NODE_ENV=production

# Build optimized bundle
npm run build
```

### 3. Verify Build Output
```bash
# Check dist/ directory
ls -lah dist/

# Expected files:
# - index.html
# - assets/ (JS, CSS bundles)
# - data/ (CSV files)
```

### 4. Test Production Build Locally
```bash
# Preview production build
npm run preview

# Test at http://localhost:4173
# - Play a complete game
# - Test all major features
# - Check console for errors
```

---

## Deployment Options

### Option A: Static Hosting (Recommended)

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

**Configuration** (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### GitHub Pages
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "gh-pages -d dist"

# Deploy
npm run build
npm run deploy
```

### Option B: Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /data {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }
}
```

**Build and run:**
```bash
docker build -t code2027:latest .
docker run -p 8080:80 code2027:latest
```

---

## Environment Configuration

### Development Environment

**`.env.development`:**
```bash
NODE_ENV=development
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### Production Environment

**`.env.production`:**
```bash
NODE_ENV=production
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
```

**Security Notes:**
- ❌ Never commit `.env` files to git
- ✅ Use environment variables in CI/CD
- ✅ Keep sensitive data in secure vaults

---

## Post-Deployment Verification

### Automated Checks

```bash
# Check HTTP status
curl -I https://your-domain.com

# Check for errors in HTML
curl -s https://your-domain.com | grep -i error

# Lighthouse audit (requires Chrome)
npx lighthouse https://your-domain.com --output html --output-path ./report.html
```

### Manual Checks

#### Functional Testing
- [ ] Game loads without errors
- [ ] Can add 2-4 players
- [ ] Can start game
- [ ] Can roll dice and move
- [ ] Can draw and play cards
- [ ] Can make choices (Accept/Reject)
- [ ] Can complete a full turn
- [ ] Can end game successfully

#### UI/UX Testing
- [ ] Mobile layout works (< 768px)
- [ ] Desktop layout works (≥ 768px)
- [ ] All expandable sections toggle correctly
- [ ] Action indicators (red dots) appear
- [ ] Next Step Button functions correctly
- [ ] Error messages display properly
- [ ] Loading states show during operations

#### Performance Testing
- [ ] Initial load < 3 seconds
- [ ] Page size < 2MB
- [ ] No console errors
- [ ] No memory leaks (play 50+ turns)
- [ ] Smooth animations (60fps)

#### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Monitoring & Maintenance

### Error Tracking

**Recommended Tools:**
- **Sentry**: For error reporting
- **LogRocket**: For session replay
- **Google Analytics**: For usage tracking

**Integration** (Future):
```typescript
// In ErrorBoundary.tsx
import * as Sentry from '@sentry/react';

componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  // Log to Sentry
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack
      }
    }
  });
}
```

### Analytics

**Recommended Metrics:**
- Page views
- Active users (DAU/MAU)
- Average session duration
- Game completion rate
- Error rate
- Load time (p50, p95, p99)

### Backup & Recovery

**Data Backup:**
```bash
# Backup CSV data files
tar -czf data-backup-$(date +%Y%m%d).tar.gz public/data/

# Store securely (S3, Drive, etc.)
```

**State Recovery:**
- Game state is stored in browser localStorage
- No server-side state to backup
- Users can export/import game saves (future feature)

---

## CI/CD Pipeline

### GitHub Actions Example

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Type check
      run: npx tsc --noEmit

    - name: Lint
      run: npm run lint

    - name: Run tests
      run: npm test

    - name: Build
      run: npm run build
      env:
        NODE_ENV: production

    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v2
      with:
        publish-dir: './dist'
        production-deploy: true
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## Rollback Procedure

### If Deployment Fails

1. **Identify Issue**
   ```bash
   # Check deployment logs
   # Check browser console
   # Check error tracking service
   ```

2. **Rollback to Previous Version**
   ```bash
   # Netlify
   netlify rollback

   # Vercel
   vercel rollback

   # GitHub Pages
   git revert HEAD
   git push origin main
   ```

3. **Fix Issue**
   ```bash
   # Fix code
   # Test locally
   # Run full test suite
   # Redeploy
   ```

---

## Security Checklist

### Pre-Deployment

- [ ] No hardcoded secrets in code
- [ ] No console.log with sensitive data
- [ ] No debug code in production build
- [ ] HTTPS enabled on hosting
- [ ] Content Security Policy configured
- [ ] CORS properly configured (if needed)

### Post-Deployment

- [ ] Run security audit: `npm audit`
- [ ] Check for outdated dependencies
- [ ] Verify HTTPS certificate
- [ ] Test CSP with browser tools
- [ ] Check for exposed API keys

---

## Performance Optimization

### Build Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    sourcemap: false, // Disable in production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          services: ['./src/services']
        }
      }
    }
  }
});
```

### Caching Strategy

```nginx
# nginx.conf
location /assets {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location /data {
  expires 1h;
  add_header Cache-Control "public, must-revalidate";
}

location ~* \.(html|json)$ {
  expires -1;
  add_header Cache-Control "no-store, no-cache, must-revalidate";
}
```

---

## Troubleshooting

### Build Fails

**Issue:** TypeScript errors
```bash
# Fix type issues
npx tsc --noEmit
# Address all errors before building
```

**Issue:** Missing dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Deployment Fails

**Issue:** Build timeout
```bash
# Increase timeout in CI/CD
# Or optimize build process
```

**Issue:** Asset loading fails
```bash
# Check base path in vite.config.ts
# Verify asset paths are correct
```

### Runtime Issues

**Issue:** White screen in production
```bash
# Check browser console
# Verify ErrorBoundary is working
# Check for missing dependencies
```

**Issue:** Data not loading
```bash
# Verify CSV files in dist/data/
# Check file paths in DataService
# Verify fetch is working
```

---

## Support & Resources

- **Documentation**: `/docs` folder
- **Issues**: GitHub Issues
- **Community**: GitHub Discussions
- **Email**: support@code2027.game

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (617+ tests)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Production build successful
- [ ] Local preview tested

### Deployment
- [ ] Environment variables set
- [ ] Build deployed to hosting
- [ ] DNS/domain configured
- [ ] HTTPS enabled
- [ ] CDN configured (if applicable)

### Post-Deployment
- [ ] Site loads successfully
- [ ] All features working
- [ ] No console errors
- [ ] Analytics tracking
- [ ] Error monitoring active
- [ ] Performance acceptable

---

**Ready to deploy Code2027 to production!** 🚀
