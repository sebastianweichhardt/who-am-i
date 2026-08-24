import { Stack } from "expo-router";

import { palette } from "@/constants/palette";
import { AuthProvider } from "@/providers/auth-provider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          animation: "fade_from_bottom",
          contentStyle: { backgroundColor: palette.background },
          headerShown: false,
        }}
      />
    </AuthProvider>
  );
}
