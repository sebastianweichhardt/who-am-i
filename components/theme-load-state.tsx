import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { palette } from "@/constants/palette";

type ThemeLoadStateProps = {
  errorMessage: string | null;
  onBack: () => void;
  onRetry: () => void;
};

export default function ThemeLoadState({
  errorMessage,
  onBack,
  onRetry,
}: ThemeLoadStateProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {errorMessage ? (
          <>
            <Text style={styles.title}>Couldn&apos;t load this theme</Text>
            <Text style={styles.message}>{errorMessage}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Try again</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onBack}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Back to themes</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator color={palette.ink} />
            <Text style={styles.message}>Loading theme…</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.background,
    flex: 1,
  },
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    maxWidth: 360,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: palette.ink,
    borderRadius: 12,
    justifyContent: "center",
    marginTop: 22,
    minHeight: 46,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    marginTop: 12,
    padding: 8,
  },
  secondaryButtonText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  pressed: {
    opacity: 0.72,
  },
});
