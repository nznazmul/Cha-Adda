import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.chaadda.app",
  appName: "Cha Adda",
  webDir: "public",
  server: {
    // Allows HTTP traffic during development (e.g. http://10.0.2.2:3000 for Android Studio Emulator)
    cleartext: true,
    androidScheme: "https",
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
