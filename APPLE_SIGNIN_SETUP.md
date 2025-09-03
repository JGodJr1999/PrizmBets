# Apple Sign-In Configuration Guide

## Current Status
✅ Firebase Apple provider configured in frontend (firebase.js)
✅ Backend endpoints support Apple provider
✅ Frontend SocialAuthButtons component handles Apple Sign-In

## Required Apple Sign-In Setup

### 1. Apple Developer Account Setup
1. Go to https://developer.apple.com/account/
2. Sign in with your Apple Developer account
3. Navigate to "Certificates, Identifiers & Profiles"
4. Create a new App ID or use existing one

### 2. Configure Services ID for Apple Sign-In
1. In Apple Developer Console, go to "Identifiers"
2. Click "+" to create new identifier
3. Choose "Services IDs"
4. Fill in:
   - Description: PrizmBets Web Auth
   - Identifier: `app.prizmbets.auth` (or similar)
5. Enable "Sign In with Apple"
6. Configure "Sign In with Apple":
   - Primary App ID: Select your main app ID
   - Web Domain: `prizmbets.app`
   - Return URLs: 
     - `https://prizmbets-5c06f.firebaseapp.com/__/auth/handler`
     - `https://prizmbets.app/__/auth/handler`
     - For development: `http://localhost:3000/__/auth/handler`

### 3. Firebase Console Configuration
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: prizmbets-5c06f
3. Go to Authentication > Sign-in method
4. Enable Apple provider:
   - OAuth client ID: Use the Services ID created above
   - OAuth client secret: Generate from Apple Developer Console
   - Key ID: From Apple Developer Console
   - Team ID: Your Apple Team ID
   - Private Key: Download from Apple Developer Console

### 4. Generate Apple Client Secret
1. In Apple Developer Console, create a new Key
2. Enable "Sign In with Apple"
3. Download the .p8 private key file
4. Use this key to generate JWT tokens for Apple authentication

### 5. Domain Verification
1. Apple requires domain ownership verification
2. Add Apple domain verification file to your website root
3. File typically named: `apple-developer-domain-association.txt`

## Current Implementation Status

### Frontend (Working)
- ✅ Firebase Apple provider configured
- ✅ SocialAuthButtons component handles Apple Sign-In
- ✅ Error handling for Apple-specific errors

### Backend (Working)
- ✅ `/api/auth/register/firebase` endpoint supports Apple provider
- ✅ User model includes Firebase UID and provider tracking
- ✅ JWT token generation working
- ✅ Database schema supports Firebase users

## Testing Apple Sign-In

### Manual Testing Steps
1. Ensure Firebase Apple provider is properly configured
2. Navigate to login/register page
3. Click "Continue with Apple" button
4. Should redirect to Apple Sign-In flow
5. After authentication, should redirect back with user data
6. Backend should create/login user successfully

### Network Debugging
If "Network error" occurs:
1. Check browser console for detailed error messages
2. Verify Firebase configuration is correct
3. Check Apple Developer Console configuration
4. Ensure domain is properly verified with Apple
5. Test with different browsers/devices

## Current Network Error Likely Causes

1. **Apple Provider Not Configured in Firebase**: Most likely cause
   - Need to complete Firebase Console setup with Apple credentials

2. **Domain Verification Missing**: 
   - Apple requires domain ownership verification
   - Need to add verification file to website

3. **Redirect URLs Mismatch**:
   - Firebase and Apple redirect URLs must match exactly
   - Check both development and production URLs

4. **Apple Developer Configuration**:
   - Services ID might not be properly configured
   - Client secret might be missing or expired

## Next Steps

1. Complete Firebase Apple provider configuration
2. Set up Apple Developer Services ID
3. Add domain verification
4. Test Apple Sign-In flow
5. Monitor authentication logs for errors

## Production Deployment Notes

- Ensure production domain (prizmbets.app) is verified with Apple
- Update redirect URLs for production environment  
- Test Apple Sign-In on actual production domain
- Consider Apple's review requirements for Sign-In with Apple