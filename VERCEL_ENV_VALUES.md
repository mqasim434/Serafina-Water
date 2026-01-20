# Vercel Environment Variables - Exact Values

Copy and paste these values into Vercel Environment Variables:

## Environment Variables to Add:

### 1. VITE_FIREBASE_API_KEY
```
AIzaSyDTSCGFDB6R9jApwr8lCAtG45sUBraC0f8
```

### 2. VITE_FIREBASE_AUTH_DOMAIN
```
serafina-water.firebaseapp.com
```

### 3. VITE_FIREBASE_PROJECT_ID
```
serafina-water
```

### 4. VITE_FIREBASE_STORAGE_BUCKET
```
serafina-water.firebasestorage.app
```

### 5. VITE_FIREBASE_MESSAGING_SENDER_ID
```
332139096500
```

### 6. VITE_FIREBASE_APP_ID
```
1:332139096500:web:b8c6a0e90a7890762aeae1
```

## Steps:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Click "Add New"
3. For each variable above:
   - **Name**: Copy the variable name (e.g., `VITE_FIREBASE_API_KEY`)
   - **Value**: Copy the value from above
   - **Environment**: Select all (Production, Preview, Development)
   - Click "Save"
4. Repeat for all 6 variables
5. Go to Deployments → Click "Redeploy" on the latest deployment

## After Redeploy:

- Check browser console - should see: `✅ Firebase initialized successfully`
- Products should load from Firestore
- App should work normally
