# 📱 Cha Adda - Android Studio সম্পূর্ণ সেটআপ ও APK গাইড

এই প্রজেক্টটিতে **Capacitor**-এর মাধ্যমে নেটিভ **Android Studio** সাপোর্ট যুক্ত করা হয়েছে। নিচের সহজ ধাপগুলো অনুসরণ করে আপনি খুব সহজেই অ্যাপটি Android Studio-তে ওপেন করে মোবাইল ফোন বা এমুলেটরে চালাতে এবং APK ফাইল তৈরি করতে পারবেন।

---

## 🚀 ধাপ ১: Android Studio-তে প্রজেক্ট ওপেন করা

১. আপনার কম্পিউটারে **Android Studio** চালু করুন।  
২. স্বাগতম স্ক্রিন থেকে **Open** বাটনে ক্লিক করুন (অথবা ভেতরে থাকলে `File > Open...` মেনু বেছে নিন)।  
৩. আপনার প্রজেক্টের ভেতরের **`android`** ফোল্ডারটি সিলেক্ট করে **OK** দিন:  
   ```
   D:\All project\CHA ADDA\android
   ```
৪. Android Studio স্বয়ংক্রিয়ভাবে প্রজেক্টের **Gradle Sync** শুরু করবে। প্রথমবার প্রয়োজনীয় লাইব্রেরি ও ডিপেন্ডেন্সি ডাউনলোড হতে ২-৩ মিনিট সময় নিতে পারে। নিচের স্ট্যাটাস বারে `Gradle build finished` লেখা আসলে সেটআপ সম্পন্ন!

---

## ⚙️ ধাপ ২: ডেভেলপমেন্ট ও লাইভ সার্ভার কনফিগারেশন

[capacitor.config.ts](file:///d:/All%20project/CHA%20ADDA/capacitor.config.ts) ফাইলে অ্যাপের কনফিগারেশন দেওয়া আছে:

```typescript
const config: CapacitorConfig = {
  appId: 'com.chaadda.app',
  appName: 'Cha Adda',
  webDir: 'public',
  server: {
    // এমুলেটরে লোকাল পিসি (localhost:3000) কানেক্ট করতে:
    // url: 'http://10.0.2.2:3000',
    
    // অথবা আপনার লাইভ Vercel সার্ভার লিংক:
    // url: 'https://your-domain.vercel.app',
    
    cleartext: true,
    androidScheme: 'https'
  }
};
```

> **টিপস:** 
> - আপনি যদি এমুলেটরে লোকাল পিসির `npm run dev` চালাতে চান, তবে `server.url = 'http://10.0.2.2:3000'` সেট করে টার্মিনালে `npm run android:sync` দিন।
> - আর যদি প্রজেক্টটি Vercel-এ হোস্ট করা থাকে, তবে সরাসরি লাইভ URL দিয়ে দিলে যেকোনো সময় ওয়েবসাইটে আপডেট করলে অ্যান্ড্রয়েড অ্যাপেও ইনস্ট্যান্ট আপডেট হয়ে যাবে!

---

## 📲 ধাপ ৩: মোবাইল ফোন বা এমুলেটরে রান করা

১. **আসল মোবাইল ফোনে টেস্ট করতে:**
   - মোবাইলের `Settings > Developer Options > USB Debugging` চালু করুন।
   - ইউএসবি ক্যাবল দিয়ে পিসির সাথে যুক্ত করুন।
   - Android Studio-র উপরের টুলবারে আপনার ফোনের মডেল শো করবে।
২. **Android Studio Emulator-এ টেস্ট করতে:**
   - টুলবার থেকে **Device Manager**-এ গিয়ে যেকোনো একটি ফোন (যেমন: Pixel 7 বা 8) তৈরি করে চালু করুন।
৩. এবার উপরের সবুজ **Run ▶** বাটনে ক্লিক করুন (কীবোর্ড শর্টকাট: `Shift + F10`)।  
   অ্যাপটি স্বয়ংক্রিয়ভাবে বিল্ড হয়ে ফোনে ইনস্টল হয়ে ওপেন হয়ে যাবে!

---

## 📦 ধাপ ৪: বন্ধুদের দেওয়ার জন্য সরাসরি APK তৈরি করা (Debug APK)

১. Android Studio-র উপরের মেনুবারে যান:
   ```
   Build  ➜  Build Bundle(s) / APK(s)  ➜  Build APK(s)
   ```
২. এক মিনিট পর নিচে একটি নোটিফিকেশন আসবে: `APK(s) generated successfully`।
৩. সেখানে **locate** লিংকে ক্লিক করলেই আপনার কাঙ্ক্ষিত `.apk` ফাইলটি পেয়ে যাবেন:
   ```
   android\app\build\outputs\apk\debug\app-debug.apk
   ```
৪. এই ফাইলটি আপনি যেকোনো অ্যান্ড্রয়েড ফোনে ব্লুটুথ, হোয়াটসঅ্যাপ বা গুগল ড্রাইভে পাঠিয়ে সরাসরি ইনস্টল করতে পারবেন!

---

## 🛍️ ধাপ ৫: Google Play Store-এর জন্য Signed Bundle (AAB) তৈরি

১. Android Studio মেনুবার থেকে:
   ```
   Build  ➜  Generate Signed Bundle / APK...
   ```
২. **Android App Bundle (.aab)** নির্বাচন করে **Next** দিন।
3. আপনার Keystore ফাইল ও পাসওয়ার্ড তৈরি/সিলেক্ট করুন।
4. **release** ভ্যারিয়েন্ট বেছে নিয়ে **Finish** দিন।
5. তৈরি হওয়া `.aab` ফাইলটি সরাসরি **Google Play Console**-এ আপলোড করতে পারবেন।

---

## 🛠️ টার্মিনাল কমান্ড শর্টকাটস

- **অ্যান্ড্রয়েড ফাইল সিঙ্ক করতে:**
  ```bash
  npm run android:sync
  ```
- **টার্মিনাল থেকেই Android Studio খুলতে:**
  ```bash
  npm run android:open
  ```
