import type { CapacitorConfig } from '@capacitor/cli';

// ─────────────────────────────────────────────────────────────────
// PRODUCTION BUILD: comment out the `server` block below before
// running `npm run build && npx cap sync android` for Play Store.
// DEV / HOT-RELOAD: leave the `server` block uncommented to
// point the Android shell at the live preview URL.
// ─────────────────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV !== 'production';

const config: CapacitorConfig = {
  appId: 'com.honestinvoice.app',
  appName: 'HonestInvoice',
  webDir: 'dist',

  // Remove this `server` block for Play Store / release builds
  ...(isDev && {
    server: {
      url: 'https://8937857b-915b-4c67-bc3a-85a05fc54ad7.lovableproject.com?forceHideBadge=true',
      cleartext: true,
    },
  }),

  android: {
    allowMixedContent: false,          // false = enforce HTTPS in production
    captureInput: true,
    webContentsDebuggingEnabled: false, // never expose DevTools in production
    backgroundColor: '#0d1117',
  },

  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0d1117',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0d1117',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#22c55e',
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0d1117',
    },
  },
};

export default config;
