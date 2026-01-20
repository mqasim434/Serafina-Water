# GitHub + CI/CD + Vercel Setup Guide

Complete guide to set up GitHub repository with CI/CD and Vercel deployment.

---

## Step 1: Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: Serafina Water Management System"
```

---

## Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository name: `serafina-water` (or your preferred name)
4. Description: "Water delivery management system"
5. Choose **Public** or **Private**
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **"Create repository"**

---

## Step 3: Push Code to GitHub

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/serafina-water.git

# Rename branch to main (if needed)
git branch -M main

# Push code
git push -u origin main
```

---

## Step 4: Set Up Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with **GitHub**
3. Click **"Add New Project"**
4. Import your `serafina-water` repository
5. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

6. **Add Environment Variables**:
   Click "Environment Variables" and add:
   - `VITE_FIREBASE_API_KEY` = your Firebase API key
   - `VITE_FIREBASE_AUTH_DOMAIN` = your Firebase auth domain
   - `VITE_FIREBASE_PROJECT_ID` = your Firebase project ID
   - `VITE_FIREBASE_STORAGE_BUCKET` = your Firebase storage bucket
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` = your messaging sender ID
   - `VITE_FIREBASE_APP_ID` = your Firebase app ID

7. Click **"Deploy"**

8. **Get Vercel Credentials** (for CI/CD):
   - Go to **Settings** → **General**
   - Copy **Project ID**
   - Go to **Settings** → **Tokens**
   - Create a new token (name it "GitHub Actions")
   - Copy the token
   - Go to your profile → **Settings** → **Teams/Orgs**
   - Copy your **Team/Org ID**

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy
vercel --prod
```

---

## Step 5: Set Up GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add the following secrets:

### Firebase Secrets:
- Name: `VITE_FIREBASE_API_KEY` → Value: your Firebase API key
- Name: `VITE_FIREBASE_AUTH_DOMAIN` → Value: your Firebase auth domain
- Name: `VITE_FIREBASE_PROJECT_ID` → Value: your Firebase project ID
- Name: `VITE_FIREBASE_STORAGE_BUCKET` → Value: your Firebase storage bucket
- Name: `VITE_FIREBASE_MESSAGING_SENDER_ID` → Value: your messaging sender ID
- Name: `VITE_FIREBASE_APP_ID` → Value: your Firebase app ID

### Vercel Secrets:
- Name: `VERCEL_TOKEN` → Value: your Vercel token (from Step 4)
- Name: `VERCEL_ORG_ID` → Value: your Vercel Team/Org ID (from Step 4)
- Name: `VERCEL_PROJECT_ID` → Value: your Vercel Project ID (from Step 4)

---

## Step 6: Verify CI/CD Pipeline

1. Make a small change to your code
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push
   ```

3. Go to your GitHub repository
4. Click the **"Actions"** tab
5. You should see:
   - **CI/CD Pipeline** workflow running** (builds and tests)
   - **Deploy to Vercel** workflow running (deploys to production)

---

## How It Works

### Automatic Deployment Flow:

1. **You push code to GitHub** → Triggers CI/CD pipeline
2. **GitHub Actions builds** → Runs linter, builds the app
3. **GitHub Actions deploys** → Automatically deploys to Vercel
4. **Vercel updates** → Your live site is updated automatically

### Branch Protection (Optional):

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date

---

## Workflow Files Created

### `.github/workflows/ci-cd.yml`
- Runs on every push and pull request
- Builds the application
- Runs linter
- Uploads build artifacts

### `.github/workflows/vercel-deploy.yml`
- Runs on push to main/master
- Builds with environment variables
- Deploys to Vercel production

---

## Environment Variables

### On Vercel:
Set in **Project Settings** → **Environment Variables**
- These are used during build and runtime

### On GitHub:
Set in **Settings** → **Secrets and variables** → **Actions**
- These are used by GitHub Actions during CI/CD

**Both need the same Firebase variables!**

---

## Testing the Setup

1. **Test Build Locally**:
   ```bash
   npm run build
   npm run preview
   ```

2. **Test CI/CD**:
   - Make a small change
   - Push to GitHub
   - Check Actions tab for workflow status

3. **Test Deployment**:
   - After CI/CD completes, check Vercel dashboard
   - Visit your live URL
   - Test the application

---

## Troubleshooting

### Issue: GitHub Actions failing

**Check**:
- All secrets are set correctly
- Workflow file syntax is correct
- Node version matches (18.x)

### Issue: Vercel deployment failing

**Check**:
- Environment variables are set on Vercel
- Build command is correct
- Output directory is `dist`

### Issue: Build succeeds but app doesn't work

**Check**:
- Environment variables are set correctly
- Firebase project is active
- Firestore security rules allow access

---

## Quick Commands

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/serafina-water.git

# Push to GitHub
git push -u origin main

# Make changes and deploy
git add .
git commit -m "Your commit message"
git push  # This triggers CI/CD automatically!
```

---

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Set up Vercel project
3. ✅ Add environment variables (both Vercel and GitHub)
4. ✅ Test deployment
5. ✅ Set up custom domain (optional)
6. ✅ Configure branch protection (optional)

---

## Custom Domain (Optional)

### On Vercel:
1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel automatically provisions SSL

---

## Monitoring

- **Vercel Dashboard**: Monitor deployments, analytics, logs
- **GitHub Actions**: Monitor build status, deployment logs
- **Firebase Console**: Monitor Firestore usage, authentication

---

**Your app will automatically deploy on every push to main branch!** 🚀
