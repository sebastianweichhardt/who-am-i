import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Card from "@/components/card";
import { palette } from "@/constants/palette";
import { fetchThemes, GameTheme } from "@/data/themes";

export default function Index() {
  const router = useRouter();
  const [themes, setThemes] = useState<GameTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadThemes = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setThemes(await fetchThemes(forceRefresh));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load themes.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadThemes();
  }, [loadThemes]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[palette.ink]}
            onRefresh={() => void loadThemes(true)}
            refreshing={isLoading && themes.length > 0}
            tintColor={palette.ink}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>A guessing game</Text>
          <Text style={styles.title}>Who am I?</Text>
          <Text style={styles.subtitle}>
            Choose a theme. Hold the phone to your forehead. Let your friends give the clues.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose a theme</Text>
          <Text style={styles.roundTime}>60 seconds</Text>
        </View>

        {isLoading && themes.length === 0 ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={palette.ink} />
            <Text style={styles.stateText}>Loading themes…</Text>
          </View>
        ) : errorMessage && themes.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Couldn&apos;t load themes</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadThemes(true)}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : themes.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>No themes yet</Text>
            <Text style={styles.stateText}>
              Add an active theme in Supabase to start playing.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {themes.map((theme) => (
              <Card
                key={theme.id}
                onPress={() =>
                  router.push({
                    pathname: "/game",
                    params: { theme: theme.id },
                  } as unknown as Href)
                }
                theme={theme}
              />
            ))}
          </View>
        )}

        <Text style={styles.tipText}>Best with two or more players.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.background,
    flex: 1,
  },
  content: {
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  header: {
    paddingBottom: 40,
    paddingTop: 44,
  },
  eyebrow: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 12,
  },
  title: {
    color: palette.ink,
    fontSize: 44,
    fontWeight: "700",
    letterSpacing: -1.8,
    lineHeight: 48,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
    marginTop: 14,
    maxWidth: 560,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: "600",
  },
  roundTime: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "400",
  },
  grid: {
    gap: 10,
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    justifyContent: "center",
    minHeight: 150,
    padding: 24,
  },
  stateTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  stateText: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 320,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: palette.ink,
    borderRadius: 10,
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonPressed: {
    opacity: 0.72,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  tipText: {
    color: palette.subtle,
    fontSize: 12,
    fontWeight: "400",
    marginTop: 20,
    textAlign: "center",
  },
});
