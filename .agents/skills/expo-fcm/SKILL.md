---
name: expo-fcm
description: Guide and automate setup of Firebase Cloud Messaging (FCM v1) with React Native and Expo EAS builds. Use when configuring native push notifications, fixing EAS APK startup crashes, setting up @react-native-firebase v22+/v27+ modular API, or verifying google-services.json and ProGuard rules.
compatibility: Requires Node.js >= 18, Expo SDK >= 50, @react-native-firebase/app, @react-native-firebase/messaging
metadata:
  author: ant-agent
  version: "1.0.0"
---

# Expo Firebase Cloud Messaging (FCM v1) Setup & Verification Skill

This skill documents the complete, battle-tested procedure to integrate **Firebase Cloud Messaging (FCM v1)** into a **React Native Expo** app built with **EAS** (standalone preview APK or production), along with an automated verification script to prevent runtime crashes.

---

## Architecture Overview

```
[ Next.js / Server Backend ]
        │  (Direct FCM v1 HTTP API with firebase-admin)
        ▼
[ Google FCM v1 Service ]
        │  (Native Device Push Token)
        ▼
[ EAS-Built Android APK / iOS App ]
    ├── @react-native-firebase/app
    └── @react-native-firebase/messaging (Modular API v22+/v27+)
```

---

## Critical Gotchas & Failure Modes

Before writing code, be aware of the 4 common traps that break FCM in modern Expo / React Native:

1. **Legacy vs Modular API Crash (`undefined is not a function`)**:
   * **Broken**: `messaging().getToken()`, `messaging().requestPermission()`. In `@react-native-firebase/messaging` v22+ through v27+, the default export function `messaging()` is deprecated or undefined.
   * **Fix**: Use modular functions:
     ```javascript
     import { getMessaging, getToken, requestPermission, onMessage, onNotificationOpenedApp, getInitialNotification, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
     const messaging = getMessaging();
     const token = await getToken(messaging);
     ```

2. **R8 / ProGuard Minification Crash on Launch (~100ms Exit)**:
   * **Problem**: In preview and release builds (`enableMinifyInReleaseBuilds=true`), R8 strips Firebase reflection classes, crashing immediately with `ClassNotFoundException`.
   * **Fix**: Install `expo-build-properties` and add explicit keep rules in `app.json`:
     ```json
     [
       "expo-build-properties",
       {
         "android": {
           "extraProguardRules": "-keep class com.google.firebase.** { *; }\n-dontwarn com.google.firebase.**\n-keep class com.google.android.gms.** { *; }\n-dontwarn com.google.android.gms.**\n-keep class io.invertase.firebase.** { *; }\n-dontwarn io.invertase.firebase.**"
         }
       }
     ]
     ```

3. **TypeScript Generic Syntax in Plain `.js` Files**:
   * **Problem**: Adding `<string>` or `<LogEntry[]>` generics to `useState` inside a `.js` file causes Metro bundler to fail during EAS export embed phase with `SyntaxError: Unexpected token`.
   * **Fix**: Keep `.js` files as pure JavaScript, or rename to `.tsx` with `tsconfig.json` present.

4. **Android 13+ Notification Permission**:
   * Android 13 (API 33+) requires runtime permission `android.permission.POST_NOTIFICATIONS` via `PermissionsAndroid.request(...)` in addition to Firebase's `requestPermission(messaging)`.

---

## Verification Checker

Run the included verification script from the root of your mobile project to validate the entire setup before triggering an EAS build:

```bash
node .agents/skills/expo-fcm/scripts/check-setup.js [path-to-mobile-project]
```

The script checks:
- [x] `google-services.json` exists and contains valid JSON with matching package name.
- [x] `app.json` has `android.package`, `android.googleServicesFile`, and required config plugins (`@react-native-firebase/app`, `@react-native-firebase/messaging`, `expo-build-properties`).
- [x] ProGuard keep rules for Firebase are configured.
- [x] `package.json` has compatible dependencies installed.
- [x] No deprecated `messaging().method()` usage exists in source files.
- [x] `eas.json` exists and includes an APK build profile.

---

## Step-by-Step Implementation Workflow

### Step 1: Install Dependencies
In the mobile project root:
```bash
npx expo install @react-native-firebase/app @react-native-firebase/messaging expo-build-properties expo-clipboard
```

### Step 2: Configure Firebase Credentials
1. Create/open a project in [Firebase Console](https://console.firebase.google.com/).
2. Register an Android app with your chosen package name (e.g. `com.example.app`).
3. Download `google-services.json` into the root of your Expo project.

### Step 3: Configure `app.json`
Ensure `app.json` contains:
```json
{
  "expo": {
    "android": {
      "package": "com.example.app",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      [
        "expo-build-properties",
        {
          "android": {
            "extraProguardRules": "-keep class com.google.firebase.** { *; }\n-dontwarn com.google.firebase.**\n-keep class com.google.android.gms.** { *; }\n-dontwarn com.google.android.gms.**\n-keep class io.invertase.firebase.** { *; }\n-dontwarn io.invertase.firebase.**"
          }
        }
      ]
    ]
  }
}
```

### Step 4: Configure `eas.json` for Standalone APK Testing
```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Step 5: Implement Background Message Handler (`index.js`)
```javascript
import { registerRootComponent } from 'expo';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';

try {
  const messaging = getMessaging();
  setBackgroundMessageHandler(messaging, async (remoteMessage) => {
    console.log('[FCM Background] Received:', remoteMessage);
  });
} catch (err) {
  console.log('[FCM Background] Registration error:', err);
}

registerRootComponent(App);
```

### Step 6: Implement Client Token & Listener (`App.js`)
See [references/implementation-template.js](./references/implementation-template.js) for the complete reference implementation including:
- Runtime Android 13+ permission request
- Native token retrieval via `getToken(getMessaging())`
- Foreground alert via `onMessage(...)`
- Background tap listener via `onNotificationOpenedApp(...)`
- Cold-start tap listener via `getInitialNotification(...)`
- Token refresh listener via `onTokenRefresh(...)`

### Step 7: Test with EAS Build
1. Run checker: `node .agents/skills/expo-fcm/scripts/check-setup.js ./mobile`
2. Run test export: `npx expo export --platform android`
3. Trigger EAS build: `eas build -p android --profile preview`
