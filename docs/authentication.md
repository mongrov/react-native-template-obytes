# Authentication Setup Guide

This guide covers the authentication system in the starter app, powered by `@mongrov/auth`.

## Overview

The authentication system provides:
- State machine-based auth flow (idle -> pending -> authenticated/unauthenticated)
- JWT token management with secure storage
- Session management with user info and permissions
- Biometric lock (Face ID / Touch ID)
- Social authentication (Apple, Google)

## Quick Start

### 1. Configure the Auth Adapter

The auth adapter connects your authentication logic to the `@mongrov/auth` state machine. Edit `src/lib/auth/adapter.ts`:

```typescript
import type { AuthAdapter } from '@mongrov/auth';
import { secureToken } from './secure-token';

export const authAdapter: AuthAdapter = {
  // Called on app start to check existing auth
  async initialize() {
    const token = await secureToken.getAccessToken();
    if (token) {
      // Validate token with your backend
      const user = await validateToken(token);
      return { user, token };
    }
    return null;
  },

  // Called when user signs in
  async signIn(credentials) {
    const response = await api.post('/auth/login', credentials);
    await secureToken.setTokens(response.accessToken, response.refreshToken);
    return { user: response.user, token: response.accessToken };
  },

  // Called when user signs out
  async signOut() {
    await secureToken.clearTokens();
  },

  // Called when access token expires
  async refreshToken() {
    const refresh = await secureToken.getRefreshToken();
    const response = await api.post('/auth/refresh', { refreshToken: refresh });
    await secureToken.setTokens(response.accessToken, response.refreshToken);
    return response.accessToken;
  },
};
```

### 2. Use Auth in Components

```typescript
import { useAuth, useSession } from '@/lib/auth';

function MyComponent() {
  const { signIn, signOut, status } = useAuth();
  const session = useSession();

  // Check auth status
  if (status === 'pending') return <Loading />;
  if (status === 'unauthenticated') return <LoginScreen />;

  // Access user info
  const { user, permissions } = session;

  // Check permissions
  if (session.hasPermission('admin')) {
    // Show admin features
  }

  return (
    <View>
      <Text>Welcome, {user.name}</Text>
      <Button onPress={signOut} title="Sign Out" />
    </View>
  );
}
```

## Biometric Lock

The biometric lock adds an extra security layer by requiring Face ID / Touch ID when returning to the app.

### Setup

1. The hook is already integrated in `src/app/(app)/_layout.tsx`
2. Users can enable/disable in Settings > Security

### How It Works

```typescript
import { useBiometricLock } from '@/lib/auth';

function AppLayout() {
  const biometric = useBiometricLock();

  // Show lock screen if locked
  if (biometric.isLocked) {
    return (
      <BiometricLockScreen
        onUnlock={biometric.unlock}
        isAuthenticating={biometric.isAuthenticating}
        error={biometric.error}
      />
    );
  }

  return <MainApp />;
}
```

### Configuration

| Property | Description |
|----------|-------------|
| `isAvailable` | Whether biometrics are available on device |
| `isEnabled` | Whether user has enabled biometric lock |
| `isLocked` | Whether app is currently locked |
| `isAuthenticating` | Whether authentication is in progress |
| `enable()` | Enable biometric lock |
| `disable()` | Disable biometric lock |
| `unlock()` | Trigger biometric authentication |

The app auto-locks after 30 seconds in background (configurable in the hook).

## Social Authentication

### Apple Sign In (iOS)

Apple Sign In works out of the box on iOS. The credentials are passed to your backend for validation.

```typescript
import { useSocialAuth } from '@mongrov/auth';

function LoginScreen() {
  const socialAuth = useSocialAuth();

  const handleAppleSignIn = async () => {
    const result = await socialAuth.signInWith('apple');
    if (result) {
      // Pass identityToken to your backend
      await api.post('/auth/apple', {
        identityToken: result.identityToken,
        user: result.user,
      });
    }
  };

  return (
    <AppleAuthButton onPress={handleAppleSignIn} />
  );
}
```

### Google Sign In

1. **Configure OAuth credentials** in Google Cloud Console
2. **Add environment variables** to `.env`:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

3. **Use in your app:**

```typescript
const socialAuth = useSocialAuth({
  google: {
    webClientId: Env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: Env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: Env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  },
});

const handleGoogleSignIn = async () => {
  const result = await socialAuth.signInWith('google');
  if (result) {
    // Pass idToken to your backend
    await api.post('/auth/google', {
      idToken: result.idToken,
      accessToken: result.accessToken,
    });
  }
};
```

## JWT Token Structure

The session hook expects JWT tokens with this structure:

```typescript
interface JWTPayload {
  sub: string;        // User ID
  email?: string;
  name?: string;
  avatarUrl?: string;
  permissions?: string[];
  tenant?: {
    id: string;
    name: string;
  };
  exp: number;        // Expiration timestamp
  iat: number;        // Issued at timestamp
}
```

## Protected Routes

Use the auth status in your root layout to protect routes:

```typescript
// src/app/(app)/_layout.tsx
export default function AppLayout() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status]);

  if (status !== 'authenticated') {
    return <SplashScreen />;
  }

  return <Stack />;
}
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth web client ID |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google OAuth iOS client ID |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google OAuth Android client ID |

## Troubleshooting

### "Biometrics not available"

- Ensure device has biometric hardware
- Check that biometrics are enrolled in device settings
- On simulator, use `Features > Face ID > Enrolled`

### "Google Sign In failed"

- Verify OAuth client IDs match your bundle ID
- Ensure SHA-1 fingerprint is added for Android
- Check that OAuth consent screen is configured

### "Token refresh failed"

- Verify refresh token endpoint returns new access token
- Check that refresh token hasn't expired
- Ensure secure storage is working (try clearing and re-logging)
