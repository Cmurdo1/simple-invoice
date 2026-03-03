# HonestInvoice – Free Invoice & Estimate Generator

**Mobile App for Android (Google Play Store) + Web**

---

## 🚀 Project Overview

HonestInvoice is a full-stack invoicing and estimate app built with React + Vite, Tailwind CSS, TypeScript, and Lovable Cloud (Supabase). It ships as both a web app and a native Android app via Capacitor.

---

## 📱 Android / Google Play Store Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| Android Studio | Latest (Ladybug+) |
| JDK | 17+ |
| Gradle | 8+ (bundled with Android Studio) |

---

### Step 1 – Clone & Install

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
```

---

### Step 2 – Build the Web App

```sh
npm run build
```

---

### Step 3 – Sync Capacitor to Android

```sh
npx cap sync android
```

> Run this every time after `npm run build` to push web assets to the native project.

---

### Step 4 – Open in Android Studio

```sh
npx cap open android
```

This opens the `android/` folder in Android Studio.

---

### Step 5 – Configure for Release (Google Play)

1. **Generate a signing keystore** (only once):

```sh
keytool -genkey -v -keystore honestinvoice-release.keystore \
  -alias honestinvoice -keyalg RSA -keysize 2048 -validity 10000
```

2. **Add signing config** to `android/app/build.gradle`:

```groovy
android {
  signingConfigs {
    release {
      storeFile file('honestinvoice-release.keystore')
      storePassword 'YOUR_STORE_PASSWORD'
      keyAlias 'honestinvoice'
      keyPassword 'YOUR_KEY_PASSWORD'
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled false
    }
  }
}
```

3. **Update version** in `android/app/build.gradle`:

```groovy
defaultConfig {
  versionCode 1        // Increment for each Play Store upload
  versionName "1.0.0"
}
```

---

### Step 6 – Build Release APK / AAB

In Android Studio:
- **Build → Generate Signed Bundle/APK**
- Choose **Android App Bundle (.aab)** for Play Store
- Or **APK** for sideloading / testing

Or via CLI:
```sh
cd android
./gradlew bundleRelease   # Produces .aab for Play Store
./gradlew assembleRelease # Produces .apk for direct install
```

Output location: `android/app/build/outputs/`

---

### Step 7 – Google Play Console Upload

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app → **HonestInvoice**
3. Package name: `com.honestinvoice.app`
4. Upload your `.aab` file under **Production → Releases**
5. Fill in store listing (description, screenshots, icon)
6. Submit for review

---

## 🛠 Development Workflow

### Run locally (web)
```sh
npm run dev
```

### Run on Android emulator / device
```sh
npm run build && npx cap sync android && npx cap run android
```

### Hot-reload on device (via Lovable Cloud preview)
The `capacitor.config.ts` points to the live Lovable preview URL, so changes reflect immediately on device without rebuilding.

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Native | Capacitor 8, Android |
| Backend | Lovable Cloud (Supabase) |
| Database | PostgreSQL (via Lovable Cloud) |
| Offline | IndexedDB (idb) |
| Auth | Lovable Cloud Auth |
| Payments | Stripe |
| PDF Export | jsPDF |

---

## 📂 Project Structure

```
├── src/
│   ├── pages/          # Route pages
│   ├── components/     # Shared UI components
│   ├── contexts/       # Auth & Theme context
│   ├── hooks/          # Custom hooks
│   ├── lib/            # offlineDb, syncEngine, pdfExport
│   └── integrations/   # Supabase client + types
├── supabase/
│   ├── functions/      # Edge functions (auto-deployed)
│   └── migrations/     # DB migrations
├── android/            # Capacitor Android project
└── capacitor.config.ts
```

---

## 🔐 Environment Variables

All secrets are managed via **Lovable Cloud → Settings → Secrets**. Required:

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe payments |
| `RESEND_API_KEY` | Email sending |
| `OPENAI_API_KEY` | AI line-item extraction |

---

## 📋 Google Play Store Requirements Checklist

- [x] App ID: `com.honestinvoice.app`
- [x] Min SDK: 24 (Android 7.0)
- [x] Target SDK: 36
- [x] Internet permission in `AndroidManifest.xml`
- [ ] App icon (512×512 PNG) – upload to Play Console
- [ ] Feature graphic (1024×500 PNG)
- [ ] Screenshots (min 2 phone screenshots)
- [ ] Privacy Policy URL: `https://honestinvoice.com/privacy`
- [ ] Content rating questionnaire completed
- [ ] Signing keystore backed up securely

---

## 🔄 Update Flow

```
Code change → npm run build → npx cap sync android → Android Studio → Build AAB → Upload to Play Console
```

---

## 📄 License

© 2026 HonestInvoice. All rights reserved.
