import { useHydrated } from "@/src/hooks/useHydrated";
import { useNotificationBridge } from "@/src/hooks/useNotificationBridge";
import { Stack } from "expo-router";
import { LogBox } from "react-native";

LogBox.ignoreLogs(["expo-notifications: Android Push notifications"]);

export default function RootLayout() {
  const hydrated = useHydrated();

  useNotificationBridge();

  if (!hydrated) return null;

  return (
    <Stack>
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}
