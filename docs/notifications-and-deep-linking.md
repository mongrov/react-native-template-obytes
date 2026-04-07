# Notifications & Deep Linking Guide

This guide covers push notifications and deep linking in the starter app.

## Push Notifications

### Overview

The notification system uses `expo-notifications` and provides:
- Permission management
- Expo push token registration
- Foreground notification handling
- Deep link navigation on tap
- Badge count management
- Android notification channels

### Setup

#### 1. Configure EAS Project ID

Add to your `.env` file:

```env
EXPO_PUBLIC_PROJECT_ID=your-eas-project-id
```

Get your project ID from [expo.dev](https://expo.dev) or run `eas project:info`.

#### 2. Configure app.config.ts

The notification plugin is already configured:

```typescript
plugins: [
  [
    'expo-notifications',
    {
      icon: './assets/notification-icon.png',
      color: '#FF6B35',
      sounds: [],
    },
  ],
],
```

#### 3. Add Notification Icon (Android)

Create a notification icon at `assets/notification-icon.png`:
- Size: 96x96 pixels
- Format: PNG with transparency
- Color: White/gray (Android applies tint)

### Usage

#### Basic Hook Usage

```typescript
import { useNotifications } from '@/lib/notifications';

function MyComponent() {
  const {
    expoPushToken,
    isEnabled,
    isLoading,
    error,
    requestPermission,
    scheduleLocalNotification,
    setBadgeCount,
  } = useNotifications();

  // Request permission
  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      // Send token to your backend
      await api.post('/users/push-token', { token: expoPushToken });
    }
  };

  return (
    <View>
      <Text>Push Token: {expoPushToken}</Text>
      <Text>Enabled: {isEnabled ? 'Yes' : 'No'}</Text>
      <Button onPress={handleEnable} title="Enable Notifications" />
    </View>
  );
}
```

#### Schedule Local Notifications

```typescript
// Simple notification (fires immediately)
await scheduleLocalNotification({
  title: 'Hello!',
  body: 'This is a test notification'
});

// With data for deep linking
await scheduleLocalNotification({
  title: 'New Message',
  body: 'You have a new message from John',
  data: { type: 'chat', conversationId: '123' }
});

// Scheduled notification
await scheduleLocalNotification({
  title: 'Reminder',
  body: 'Don\'t forget your meeting!',
  trigger: { seconds: 60 } // Fire in 60 seconds
});
```

#### Handle Notification Taps

The hook automatically handles navigation based on notification data:

```typescript
// Notification data structure
interface NotificationData {
  type?: 'chat' | 'message' | 'general';
  conversationId?: string;
  messageId?: string;
}

// When tapped:
// - type: 'chat' + conversationId -> navigates to /chat/[conversationId]
// - type: 'chat' without conversationId -> navigates to /chat
```

#### Badge Count

```typescript
// Get current badge count
const count = await getBadgeCount();

// Set badge count
await setBadgeCount(5);

// Clear badge
await setBadgeCount(0);
```

### Android Notification Channels

Two channels are pre-configured:

| Channel | Name | Importance | Use Case |
|---------|------|------------|----------|
| `default` | Default | MAX | General notifications |
| `chat` | Chat Messages | HIGH | Chat-related notifications |

### Settings Integration

The notification toggle is in Settings > Security:

```typescript
// In settings screen
import { NotificationItem } from './components/notification-item';

<SettingsContainer title="settings.security">
  <BiometricItem />
  <NotificationItem isLast />
</SettingsContainer>
```

### Backend Integration

Send push notifications from your server:

```typescript
// Server-side example (Node.js)
const { Expo } = require('expo-server-sdk');

const expo = new Expo();

// Get push token from your database
const pushToken = user.expoPushToken;

const message = {
  to: pushToken,
  sound: 'default',
  title: 'New Message',
  body: 'You have a new message',
  data: {
    type: 'chat',
    conversationId: '123',
  },
};

await expo.sendPushNotificationsAsync([message]);
```

## Deep Linking

### Overview

Deep linking allows your app to:
- Open specific screens via URL
- Share content with custom URLs
- Handle universal links (https://)
- Respond to notification taps

### URL Schemes

#### Custom Scheme

Default scheme: `obytesApp://`

Examples:
- `obytesApp://chat` - Open chat list
- `obytesApp://chat/123` - Open specific chat
- `obytesApp://settings` - Open settings
- `obytesApp://profile` - Open profile

#### Universal Links (Optional)

Configure `EXPO_PUBLIC_ASSOCIATED_DOMAIN` in `.env`:

```env
EXPO_PUBLIC_ASSOCIATED_DOMAIN=https://app.yourcompany.com
```

This enables:
- iOS: Associated Domains for universal links
- Android: Intent filters for App Links

### Usage

```typescript
import { useDeepLink } from '@/lib/deep-link';

function ShareButton({ conversationId }) {
  const { createLink, openURL } = useDeepLink();

  const handleShare = async () => {
    // Create a shareable link
    const link = createLink(`chat/${conversationId}`);
    // => "obytesApp://chat/123"

    // Share via system share sheet
    await Share.share({ url: link });
  };

  const handleOpenWebsite = async () => {
    await openURL('https://example.com');
  };

  return (
    <View>
      <Button onPress={handleShare} title="Share Chat" />
      <Button onPress={handleOpenWebsite} title="Visit Website" />
    </View>
  );
}
```

### Handle Incoming Links

The hook automatically handles incoming links:

```typescript
function App() {
  const { lastDeepLink } = useDeepLink();

  // React to deep links
  useEffect(() => {
    if (lastDeepLink) {
      console.log('Received deep link:', lastDeepLink);
      // { url, path, hostname, queryParams }
    }
  }, [lastDeepLink]);

  return <MainApp />;
}
```

### Route Mapping

expo-router automatically maps URLs to screens:

| URL | Screen File | Route |
|-----|-------------|-------|
| `obytesApp://` | `src/app/index.tsx` | `/` |
| `obytesApp://chat` | `src/app/(app)/chat/index.tsx` | `/chat` |
| `obytesApp://chat/123` | `src/app/(app)/chat/[id].tsx` | `/chat/123` |
| `obytesApp://settings` | `src/app/(app)/settings.tsx` | `/settings` |
| `obytesApp://profile` | `src/app/(app)/profile.tsx` | `/profile` |

### Universal Links Setup (Production)

#### iOS

1. Add Associated Domains entitlement in your Apple Developer account
2. Host `apple-app-site-association` file at your domain:

```json
// https://app.yourcompany.com/.well-known/apple-app-site-association
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": ["TEAM_ID.com.yourcompany.app"],
        "paths": ["*"]
      }
    ]
  }
}
```

#### Android

1. Host `assetlinks.json` at your domain:

```json
// https://app.yourcompany.com/.well-known/assetlinks.json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.yourcompany.app",
      "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
    }
  }
]
```

### Query Parameters

```typescript
// Create link with params
const link = createLink('chat/123', {
  ref: 'notification',
  highlight: 'message-456',
});
// => "obytesApp://chat/123?ref=notification&highlight=message-456"

// Access params in your screen
function ChatScreen() {
  const { highlight } = useLocalSearchParams();
  // highlight = "message-456"
}
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_PROJECT_ID` | EAS project ID for push tokens |
| `EXPO_PUBLIC_SCHEME` | Custom URL scheme (default: `obytesApp`) |
| `EXPO_PUBLIC_ASSOCIATED_DOMAIN` | Domain for universal links |

## Testing

### Test Push Notifications

1. **Expo Go**: Use the [Expo Push Notifications Tool](https://expo.dev/notifications)
2. **Development Build**: Test with real device
3. **Simulator**: iOS simulator doesn't support push notifications

### Test Deep Links

```bash
# iOS Simulator
xcrun simctl openurl booted "obytesApp://chat/123"

# Android Emulator
adb shell am start -a android.intent.action.VIEW -d "obytesApp://chat/123"

# From terminal (opens on device)
npx uri-scheme open "obytesApp://chat/123" --ios
npx uri-scheme open "obytesApp://chat/123" --android
```

## Troubleshooting

### "Push token is null"

- Ensure running on physical device (not simulator)
- Check that `EXPO_PUBLIC_PROJECT_ID` is set
- Verify permissions are granted

### "Notifications not received"

- Check token is registered with backend
- Verify Expo push service status
- Ensure app is not in foreground (or handle foreground separately)

### "Deep link not opening app"

- Verify URL scheme matches `EXPO_PUBLIC_SCHEME`
- Check app is installed
- For universal links, verify domain configuration

### "Universal links not working"

- Verify AASA/assetlinks.json files are hosted correctly
- Check SSL certificate is valid
- Ensure app is built with correct entitlements
