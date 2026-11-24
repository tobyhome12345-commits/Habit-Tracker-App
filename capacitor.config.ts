import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.habittracker.app',
  appName: 'Habit Tracker',
  webDir: 'dist',
  plugins: {
    SystemBars: {
      // Injects --safe-area-inset-* CSS variables so content never hides under the status/nav bars.
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
    },
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      showSpinner: false,
    },
  },
};

export default config;
