import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.honestinvoice.app',
  appName: 'Honest Invoice',
  webDir: 'dist',
  server: {
    // Hot-reload from Lovable Cloud preview during development
    // Comment out for production builds
    url: 'https://8937857b-915b-4c67-bc3a-85a05fc54ad7.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0d1117',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#22c55e',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
