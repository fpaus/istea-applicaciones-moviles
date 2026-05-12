# Recurring Reminders

A React Native mobile application for scheduling daily recurring reminders and managing completed tasks.

## Prerequisites

- Node.js installed
- Android Studio / Android SDK (for Android Emulator) or Xcode (for iOS Simulator)
- Expo CLI or Expo Go app on your physical device

## How to Run

1. **Install the dependencies**

   ```bash
   npm install
   ```

2. **Start the Metro Bundler**

   ```bash
   npm run start
   ```

   *(Note: If you need to specify your Android SDK path, you can run `ANDROID_HOME=/path/to/sdk npm run start`)*

3. **Launch the App**
   Once the bundler is running, you can:
   - Press **`a`** in your terminal to open the app on an Android Emulator.
   - Press **`i`** to open the app on an iOS Simulator.
   - Scan the **QR Code** with your phone's camera (iOS) or the Expo Go app (Android) to run it on a physical device.

> **Note:** The app seeds mock users (`admin@example.com` / `password: admin`) and 25 mock reminders into local storage the very first time it runs so you can test it immediately.
