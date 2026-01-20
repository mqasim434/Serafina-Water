# Vercel Environment Variables Setup

## Quick Fix for "Firebase not initialized" Error

The error occurs because Firebase environment variables are not set in Vercel.

## Steps to Fix:

### 1. Go to Vercel Dashboard
- Visit [vercel.com](https://vercel.com)
- Select your project: **Serafina-Water**

### 2. Navigate to Settings
- Click on your project
- Go to **Settings** tab
- Click on **Environment Variables** in the left sidebar

### 3. Add These Environment Variables

Add ALL of the following variables (one by one):

| Variable Name | Description | Where to Find |
|--------------|-------------|---------------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | Firebase Console → Project Settings → General → Your apps → Web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth Domain | Usually: `your-project-id.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Project ID | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage Bucket | Usually: `your-project-id.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID | Firebase Console → Project Settings → Cloud Messaging |
| `VITE_FIREBASE_APP_ID` | App ID | Firebase Console → Project Settings → General → Your apps → Web app config |

### 4. Where to Find Firebase Config Values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ → **Project Settings**
4. Scroll down to **Your apps** section
5. If you don't have a web app, click **Add app** → Select **Web** (</> icon)
6. Copy the config values from the `firebaseConfig` object

Example:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",           // ← VITE_FIREBASE_API_KEY
  authDomain: "xxx.firebaseapp.com",  // ← VITE_FIREBASE_AUTH_DOMAIN
  projectId: "your-project-id",      // ← VITE_FIREBASE_PROJECT_ID
  storageBucket: "xxx.appspot.com",   // ← VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789",     // ← VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123:web:abc"              // ← VITE_FIREBASE_APP_ID
};
```

### 5. Set Environment for All Environments
- When adding each variable, select:
  - ✅ **Production**
  - ✅ **Preview**
  - ✅ **Development**

### 6. Redeploy
- After adding all variables, go to **Deployments** tab
- Click the **⋯** (three dots) on the latest deployment
- Click **Redeploy**
- Or push a new commit to trigger automatic redeploy

### 7. Verify
After redeploy, check the browser console:
- Should see: `✅ Firebase initialized successfully`
- Should NOT see: `❌ Missing Firebase configuration`

## Troubleshooting

### Still seeing errors?
1. **Check variable names**: Must start with `VITE_` prefix
2. **Check for typos**: Variable names are case-sensitive
3. **Redeploy**: Environment variables only apply to new deployments
4. **Check browser console**: Look for specific missing variables

### Variables are set but still not working?
- Make sure you **redeployed** after adding variables
- Check that variables are set for **Production** environment
- Verify there are no extra spaces in variable values

## Quick Test

After setup, the app should:
- ✅ Load without Firebase errors
- ✅ Show products from Firestore
- ✅ Allow login with admin/admin
- ✅ Save data to Firebase
