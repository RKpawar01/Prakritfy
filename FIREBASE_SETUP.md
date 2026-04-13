# Firebase Setup Guide for Prakritfy Consultation Booking Form

## Steps to Setup Firebase:

### 1. Create Firebase Account & Project
- Go to [Firebase Console](https://console.firebase.google.com/)
- Click "Create a new project"
- Name it something like "Prakritfy" 
- Disable Google Analytics (optional)
- Click "Create project"

### 2. Create Web App
- In the Firebase console, click the Web icon (</> symbol)
- Name it "Prakritfy Web"
- Check "Also set up Firebase Hosting" (optional)
- Click "Register app"

### 3. Get Your Configuration Keys
Firebase will show you a configuration object with these keys:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`
- `databaseURL` (optional, for Realtime Database)

### 4. Setup Firestore Database
- In Firebase Console, go to "Build" → "Firestore Database"
- Click "Create Database"
- Choose "Start in production mode"
- Select your region (closest to your users)
- Click "Create"

### 5. Create Collection (Important!)
- Once Firestore is created, click "Start collection"
- Collection ID: `consultationBookings`
- Add document: Auto ID
- Click "Save"

### 6. Update .env.local File
Copy and paste the configuration keys from Firebase into `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url_here
```

**Example (don't use these):**
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=prakritfy.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=prakritfy-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=prakritfy-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://prakritfy-xxxxx.firebasedatabase.app
```

### 7. Setup Firestore Security Rules (Optional)
Go to Firestore → Rules, update to allow writes:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /consultationBookings/{document=**} {
      allow read, write: if request.auth != null || request.path == [resource].id;
      // Or for public access:
      allow read, write: if true;
    }
  }
}
```

### 8. Install Firebase Dependency
```bash
npm install firebase
```

## Done!
The form will now automatically save consultation bookings to Firebase Firestore.

All bookings will appear as documents in your `consultationBookings` collection with:
- `fullName`
- `phoneNumber`
- `preferredDate`
- `preferredTime`
- `notes`
- `submittedAt` (timestamp)
- `status` (pending)
