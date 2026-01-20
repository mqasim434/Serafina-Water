# Quick Deployment Guide

## Fastest Option: Vercel (Recommended)

### Step 1: Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Push to GitHub

1. Create a new repository on GitHub
2. Push your code:
```bash
git remote add origin https://github.com/yourusername/serafina-water.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. **Configure Environment Variables**:
   - Click "Environment Variables"
   - Add all Firebase variables:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
6. Click "Deploy"

**That's it!** Your app will be live in ~2 minutes.

---

## Alternative: Firebase Hosting

Since you're using Firebase, you can also host on Firebase:

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login

```bash
firebase login
```

### Step 3: Initialize Hosting

```bash
firebase init hosting
```

Select:
- Your Firebase project
- Public directory: `dist`
- Single-page app: `Yes`
- Overwrite index.html: `No`

### Step 4: Build and Deploy

```bash
npm run build
firebase deploy --only hosting
```

**Note**: For Firebase Hosting, you'll need to build locally with your `.env.production` file since Firebase Hosting doesn't support build-time environment variables easily.

---

## Build for Production

Before deploying, test your production build:

```bash
npm run build
npm run preview
```

This will show you how the app will look in production.

---

## Environment Variables

Make sure to set these on your hosting platform:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

---

## Post-Deployment

1. Test the live site
2. Verify Firebase connection
3. Test login
4. Change default admin password
5. Set up custom domain (optional)
