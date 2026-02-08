import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pipsprofit.app',
  appName: 'Day Trading Journal',
  webDir: 'dist',
  android: {
    backgroundColor: '#0f172a',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
      overlaysWebView: false
    },
    SplashScreen: {
      backgroundColor: '#0f172a',
      launchAutoHide: true,
      launchShowDuration: 2000
    }
  }
};

export default config;
