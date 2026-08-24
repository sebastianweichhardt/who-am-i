import { Stack } from "expo-router";

import { palette } from "@/constants/palette";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        animation: "fade_from_bottom",
        contentStyle: { backgroundColor: palette.background },
        headerShown: false,
      }}
    />
  );
}
