# Email/Password Authentication - Step-by-Step Implementation Guide

## ✅ What's Been Done

1. ✅ Removed all Google sign-in code
2. ✅ Fixed email/password authentication
3. ✅ Fixed forgot password functionality
4. ✅ Added Firestore database initialization
5. ✅ Improved error handling

## 📋 Step-by-Step Setup Instructions

### Step 1: Enable Email/Password Authentication in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **pipsprofit-32cbe**
3. Click on **Authentication** in the left sidebar
4. Click on **Sign-in method** tab
5. Find **Email/Password** in the list
6. Click on it
7. **Enable** the first toggle (Email/Password - not Email link)
8. Click **Save**

**✅ Verification**: You should see "Email/Password" with a green checkmark

---

### Step 2: Set Up Firestore Database

1. In Firebase Console, click **Firestore Database** in the left sidebar
2. If you see "Create database", click it
3. Choose **Start in test mode** (for development)
   - ⚠️ **Important**: For production, you'll need proper security rules
4. Select a **location** (choose the closest to your users)
   - Recommended: `us-central1` or `europe-west1`
5. Click **Enable**
6. Wait for the database to be created (takes ~30 seconds)

**✅ Verification**: You should see the Firestore Database interface

---

### Step 3: Configure Firestore Security Rules

1. In Firestore Database, click the **Rules** tab
2. Replace the entire rules section with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Trades collection - users can only access their own trades
    match /trades/{tradeId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Accounts collection - users can only access their own accounts
    match /accounts/{accountId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Strategies collection - users can only access their own strategies
    match /strategies/{strategyId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click **Publish**

**✅ Verification**: Rules should show "Published" status

---

### Step 4: Configure Password Reset Email (Optional but Recommended)

1. In Firebase Console, go to **Authentication** → **Templates**
2. Click on **Password reset**
3. You can customize:
   - **Sender name**: "Day Trading Journal"
   - **Subject**: "Reset your password"
   - **Email body**: Customize if needed
4. Click **Save**

**✅ Verification**: Template should be saved

---

### Step 5: Test the Implementation

#### Test Sign Up:
1. Run your app: `npm run dev`
2. Click "Don't have an account? Sign Up"
3. Enter an email and password (min 6 characters)
4. Click "Sign Up"
5. **Check Firebase Console** → Authentication → Users
   - You should see the new user

#### Test Sign In:
1. Use the email/password you just created
2. Click "Sign In"
3. You should be taken to the name/PIN setup screen

#### Test Forgot Password:
1. Click "Forgot Password?"
2. Enter your email
3. Click "Send Reset Link"
4. **Check your email** (and spam folder)
5. Click the reset link in the email
6. Set a new password

---

## 🔧 Code Changes Made

### Files Updated:

1. **`src/authService.js`**
   - ✅ Removed all Google sign-in code
   - ✅ Simplified to only email/password
   - ✅ Fixed password reset function

2. **`src/firebase.js`**
   - ✅ Added Firestore initialization
   - ✅ Cleaned up unused imports
   - ✅ Exported `db` for Firestore usage

3. **`components/AuthScreen.tsx`**
   - ✅ Removed Google sign-in button
   - ✅ Removed Google sign-in handler
   - ✅ Fixed forgot password with better error handling
   - ✅ Improved email validation

---

## 🚀 Next Steps (Firestore Integration)

To sync data with Firestore, you'll need to:

1. **Create a Firestore service** (`src/firestoreService.js`):
   - Functions to save/load trades
   - Functions to save/load accounts
   - Functions to save/load strategies
   - Real-time sync with local storage

2. **Update StoreContext** to:
   - Sync with Firestore on login
   - Save to Firestore when data changes
   - Handle offline/online sync

3. **Add user document creation**:
   - Create user document in Firestore on first sign up
   - Store user profile data

---

## 🐛 Troubleshooting

### "Password reset email not sent"
- ✅ Check Firebase Console → Authentication → Templates → Password reset
- ✅ Verify email/password authentication is enabled
- ✅ Check spam folder
- ✅ Verify email address is correct
- ✅ Check browser console for errors

### "User not found" error
- ✅ Make sure you've signed up first
- ✅ Check Firebase Console → Authentication → Users
- ✅ Verify the email is correct

### "Invalid email" error
- ✅ Check email format (must have @ and .)
- ✅ Try a different email address

### "Weak password" error
- ✅ Password must be at least 6 characters
- ✅ Use a stronger password

### Firestore "Permission denied"
- ✅ Check security rules are published
- ✅ Verify user is authenticated
- ✅ Check that userId matches in documents

---

## 📝 Testing Checklist

- [ ] Email/Password authentication enabled in Firebase
- [ ] Firestore database created
- [ ] Security rules published
- [ ] Can sign up with new email/password
- [ ] Can sign in with credentials
- [ ] Can reset password
- [ ] Password reset email received
- [ ] Can change password via reset link
- [ ] User appears in Firebase Console → Authentication → Users

---

## 💡 Tips

1. **Development**: Use test mode for Firestore (already configured)
2. **Production**: Update security rules before going live
3. **Email**: Firebase sends emails from `noreply@firebaseapp.com`
4. **Testing**: Create test accounts to verify everything works
5. **Monitoring**: Check Firebase Console regularly for errors

---

## 📚 Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Email Templates](https://firebase.google.com/docs/auth/custom-email-handler)

---

**You're all set!** Follow the steps above and your email/password authentication will be fully functional. 🎉

