# Firebase Setup Guide - Email/Password Authentication & Firestore Database

## Step 1: Enable Email/Password Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **pipsprofit-32cbe**
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Email/Password**
5. Enable the first toggle: **Email/Password** (not "Email link")
6. Click **Save**

## Step 2: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
   - **Note**: For production, you'll need to set up proper security rules
4. Select a location (choose closest to your users)
5. Click **Enable**

## Step 3: Configure Firestore Security Rules (Important!)

1. In Firestore Database, go to **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
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

## Step 4: Configure Password Reset Email Template (Optional but Recommended)

1. In Firebase Console, go to **Authentication** → **Templates**
2. Click on **Password reset**
3. Customize the email template if desired
4. The default template works fine, but you can:
   - Change the sender name
   - Customize the email subject
   - Add your app logo
5. Click **Save**

## Step 5: Test Email/Password Authentication

1. Run your app
2. Try to sign up with a new email/password
3. Check Firebase Console → Authentication → Users to see if the user was created
4. Try to sign in with the credentials
5. Try the "Forgot Password" feature

## Step 6: Install Firestore SDK (Already in package.json)

The Firestore SDK is already included in your Firebase package. No additional installation needed.

## Step 7: Update Your Code to Use Firestore

The code has been updated to:
- ✅ Remove Google sign-in
- ✅ Fix email/password authentication
- ✅ Fix forgot password functionality
- ✅ Ready for Firestore integration

## Next Steps for Firestore Integration

You'll need to:
1. Create a Firestore service file to handle database operations
2. Update your StoreContext to sync with Firestore
3. Implement real-time sync between local storage and Firestore

## Troubleshooting

### Password Reset Not Working?
- Check Firebase Console → Authentication → Templates → Password reset
- Ensure email/password authentication is enabled
- Check your email spam folder
- Verify the email address is correct

### Firestore Permission Denied?
- Check your security rules
- Ensure the user is authenticated
- Verify the userId matches in the document

### Authentication Errors?
- Check Firebase Console → Authentication → Users
- Verify email/password is enabled
- Check browser console for detailed error messages

