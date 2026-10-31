import type { CapacitorConfig } from "@capacitor/cli";

// Supports local development via environment variable or default to the live production server
const serverUrl =
  process.env.CAPACITOR_SERVER_URL || "https://cha-adda-meet-swap.vercel.app";

const config: CapacitorConfig = {
  appId: "com.chaadda.app",
  appName: "Cha Adda",
  webDir: "public",
  server: {
    url: serverUrl,
    // Allows HTTP traffic during local development (e.g. http://10.0.2.2:3000 for Android Studio Emulator)
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
