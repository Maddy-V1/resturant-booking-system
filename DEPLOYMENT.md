# Deployment Guide

## 🚀 Quick Deploy

### Backend (Render)

**Start Command:**
```bash
npm start
```

**Build Command:**
```bash
npm install
```

**Environment Variables:**
```
NODE_ENV=production
PORT=5001
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<your-secret-key>
CORS_ORIGIN=<your-frontend-urls>
```

### Frontend User (Vercel/Netlify)

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
dist
```

**Environment Variables:**
```
VITE_API_URL=<your-backend-url>/api
VITE_SOCKET_URL=<your-backend-url>
```

### Frontend Admin (Vercel/Netlify)

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
dist
```

**Environment Variables:**
```
VITE_API_URL=<your-backend-url>/api
VITE_SOCKET_URL=<your-backend-url>
```

## 🧪 Test Users

After deployment, create test users:

```bash
# In Render shell or locally
cd backend
npm run create-test-users
```

**Test Credentials:**
- Student: `test@student.com` / `Test123456`
- Staff: `test@staff.com` / `Test123456`

## 📝 Notes

- Test users work offline (no backend needed)
- Backend on cold start shows demo banner
- All features work with test users
