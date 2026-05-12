import { AuthProvider } from "@/src/providers/auth-provider";
import { RemindersProvider } from "@/src/providers/reminders-provider";
import { Stack } from "expo-router";
import { LogBox } from "react-native";
import { useEffect, useState } from "react";
import { seedMockData } from "@/src/mock-data";

LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
]);

export default function RootLayout() {
  const [isSeeded, setIsSeeded] = useState(false);

  useEffect(() => {
    const seed = async () => {
      await seedMockData();
      setIsSeeded(true);
    };
    seed();
  }, []);

  if (!isSeeded) return null;

  return (
    <AuthProvider>
      <RemindersProvider>
        <Stack>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </RemindersProvider>
    </AuthProvider>
  );
}
