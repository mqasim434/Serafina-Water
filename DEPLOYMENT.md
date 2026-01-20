# Deployment Guide

This guide covers deploying the Serafina Water application to various hosting platforms.

## Prerequisites

1. Build the application: `npm run build`
2. Set up environment variables on your hosting platform
3. Ensure Firebase is configured (see FIREBASE_SETUP.md)

---

## Option 1: Vercel (Recommended - Easiest)

Vercel is the easiest option for React/Vite applications with automatic deployments.

### Steps:

1. **Install Vercel CLI** (optional, or use web interface):
   ```bash
   npm install -g vercel
   ```

2. **Build your project**:
   ```bash
   npm run build
   ```

3. **Deploy via CLI**:
   ```bash
   vercel
   ```
   Follow the prompts to link your project.

4. **Or deploy via GitHub**:
   - Push your code to GitHub
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables (see below)
   - Deploy!

### Environment Variables on Vercel:

Go to Project Settings > Environment Variables and add:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Vercel Configuration:

Create `vercel.json` in project root (optional):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite"
}
```

---

## Option 2: Firebase Hosting

Since you're already using Firebase, hosting on Firebase is a natural choice.

### Steps:

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**:
   ```bash
   firebase init hosting
   ```
   
   When prompted:
   - Select your Firebase project
   - Public directory: `dist`
   - Configure as single-page app: `Yes`
   - Set up automatic builds: `No` (or `Yes` if you want)
   - Overwrite index.html: `No`

4. **Build your project**:
   ```bash
   npm run build
   ```

5. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

### Firebase Hosting Configuration:

The `firebase.json` file will be created automatically. You can customize it:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Environment Variables:

For Firebase Hosting, you need to set environment variables during build. You can:
- Use `.env.production` file (but don't commit it!)
- Or use Firebase Functions (more complex)
- Or build locally and deploy the built files

**Recommended approach**: Build locally with `.env.production`, then deploy:
```bash
# Create .env.production with your Firebase config
npm run build
firebase deploy --only hosting
```

---

## Option 3: Netlify

Netlify is another excellent option with great React support.

### Steps:

1. **Install Netlify CLI** (optional):
   ```bash
   npm install -g netlify-cli
   ```

2. **Build your project**:
   ```bash
   npm run build
   ```

3. **Deploy via CLI**:
   ```bash
   netlify deploy --prod
   ```

4. **Or deploy via GitHub**:
   - Push your code to GitHub
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variables (see below)
   - Deploy!

### Netlify Configuration:

Create `netlify.toml` in project root:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Environment Variables on Netlify:

Go to Site Settings > Environment Variables and add all Firebase variables.

---

## Option 4: GitHub Pages

Free hosting option, but requires some setup.

### Steps:

1. **Install gh-pages package**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json**:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist",
       "homepage": "https://yourusername.github.io/serafina-water"
     }
   }
   ```

3. **Update vite.config.js**:
   ```javascript
   export default {
     base: '/serafina-water/', // Your repo name
     // ... rest of config
   }
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

**Note**: GitHub Pages doesn't support environment variables easily. You may need to build locally with production env vars.

---

## Build Configuration

### Production Build:

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### Preview Build Locally:

```bash
npm run preview
```

### Environment Variables:

For production, create `.env.production`:
```env
VITE_FIREBASE_API_KEY=your_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Important**: Never commit `.env.production` to Git!

---

## Post-Deployment Checklist

1. ✅ Test the deployed application
2. ✅ Verify Firebase connection works
3. ✅ Test login functionality
4. ✅ Verify data persistence (Firestore)
5. ✅ Check that all features work correctly
6. ✅ Test on mobile devices
7. ✅ Set up custom domain (optional)
8. ✅ Configure SSL/HTTPS (usually automatic)

---

## Troubleshooting

### Issue: Environment variables not working

**Solution**:
- Ensure all variables start with `VITE_`
- Rebuild after changing environment variables
- Check hosting platform's environment variable settings
- Verify variables are set for production environment

### Issue: Routes not working (404 errors)

**Solution**:
- Configure redirects to `/index.html` for SPA routing
- Check hosting platform's rewrite rules
- Verify `vite.config.js` base path is correct

### Issue: Firebase not connecting

**Solution**:
- Verify all environment variables are set correctly
- Check browser console for Firebase errors
- Ensure Firestore security rules allow access
- Verify Firebase project is active

### Issue: Build fails

**Solution**:
- Check for TypeScript/ESLint errors: `npm run lint`
- Ensure all dependencies are installed: `npm install`
- Check Node.js version compatibility
- Review build logs for specific errors

---

## Recommended: Vercel

For this project, **Vercel** is recommended because:
- ✅ Zero configuration needed
- ✅ Automatic deployments from GitHub
- ✅ Free SSL/HTTPS
- ✅ Great performance
- ✅ Easy environment variable management
- ✅ Preview deployments for PRs

### Quick Vercel Deploy:

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import repository
4. Add environment variables
5. Deploy!

---

## Custom Domain Setup

### Vercel:
1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Firebase Hosting:
1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow verification steps
4. Update DNS records

### Netlify:
1. Go to Site Settings > Domain Management
2. Add custom domain
3. Follow DNS configuration

---

## Continuous Deployment

### GitHub Actions (for any hosting):

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

---

## Security Notes

1. **Never commit** `.env` or `.env.production` files
2. **Use environment variables** on hosting platform
3. **Review Firestore security rules** before going live
4. **Change default admin password** immediately
5. **Enable HTTPS** (usually automatic)
6. **Regular backups** of Firestore data

---

## Support

If you encounter deployment issues:
1. Check hosting platform's documentation
2. Review build logs
3. Test locally with `npm run preview`
4. Verify all environment variables are set
