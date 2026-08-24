import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { GuessResult } from "@/app/game";
import ThemeLoadState from "@/components/theme-load-state";
import { palette } from "@/constants/palette";
import { fetchTheme, type GameTheme } from "@/data/themes";

export default function ResultsScreen() {
  const params = useLocalSearchParams<{ results?: string; theme?: string }>();
  const router = useRouter();
  const [theme, setTheme] = useState<GameTheme | null>(null);
  const [themeError, setThemeError] = useState<string | null>(null);
  const results = useMemo(() => parseResults(params.results), [params.results]);
  const correct = results.filter((result) => result.correct);
  const passed = results.filter((result) => !result.correct);

  const loadTheme = useCallback(async () => {
    setTheme(null);
    setThemeError(null);

    if (!params.theme) {
      setThemeError("The round does not include a theme.");
      return;
    }

    try {
      const nextTheme = await fetchTheme(params.theme);
      if (!nextTheme) {
        setThemeError("This theme is unavailable or no longer active.");
        return;
      }
      setTheme(nextTheme);
    } catch (error) {
      setThemeError(
        error instanceof Error ? error.message : "Unable to load this theme.",
      );
    }
  }, [params.theme]);

  useEffect(() => {
    void loadTheme();
  }, [loadTheme]);

  if (!theme) {
    return (
      <ThemeLoadState
        errorMessage={themeError}
        onBack={() => router.replace("/")}
        onRetry={() => void loadTheme()}
      />
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={[styles.themeMark, { backgroundColor: theme.color }]} />
          <Text style={styles.kicker}>Round complete</Text>
          <Text style={styles.title}>Nice guessing.</Text>
          <Text style={styles.themeName}>{theme.title}</Text>
        </View>

        <View style={styles.scoreCard}>
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreValue}>{correct.length}</Text>
            <Text style={styles.scoreLabel}>Correct</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreValue}>{results.length}</Text>
            <Text style={styles.scoreLabel}>Played</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreValue}>{passed.length}</Text>
            <Text style={styles.scoreLabel}>Passed</Text>
          </View>
        </View>

        <ResultSection
          color={palette.ink}
          emptyMessage="No correct guesses this time — rematch?"
          icon="check"
          results={correct}
          title="You got these"
        />
        <ResultSection
          color={palette.danger}
          emptyMessage="Perfect — you didn't pass on any!"
          icon="close"
          results={passed}
          title="Not this time"
        />

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.replace({
              pathname: "/game",
              params: { theme: theme.id },
            } as unknown as Href)
          }
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons color="#FFFFFF" name="replay" size={20} />
          <Text style={styles.primaryButtonText}>Play this theme again</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/")}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Choose another theme</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultSection({
  color,
  emptyMessage,
  icon,
  results,
  title,
}: {
  color: string;
  emptyMessage: string;
  icon: "check" | "close";
  results: GuessResult[];
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <MaterialCommunityIcons color={color} name={icon} size={18} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{results.length}</Text>
      </View>
      <View style={styles.resultList}>
        {results.length ? (
          results.map((result, index) => (
            <View key={`${result.prompt}-${index}`} style={styles.resultRow}>
              <Text style={styles.resultText}>{result.prompt}</Text>
              <MaterialCommunityIcons color={color} name={icon} size={17} />
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        )}
      </View>
    </View>
  );
}

function parseResults(value: string | undefined): GuessResult[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is GuessResult =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as GuessResult).prompt === "string" &&
        typeof (item as GuessResult).correct === "boolean",
    );
  } catch {
    return [];
  }
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
  hero: {
    alignItems: "flex-start",
    paddingBottom: 30,
    paddingTop: 44,
  },
  themeMark: {
    borderRadius: 2,
    height: 4,
    marginBottom: 22,
    width: 38,
  },
  kicker: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  title: {
    color: palette.ink,
    fontSize: 38,
    fontWeight: "700",
    letterSpacing: -1.2,
    marginTop: 8,
  },
  themeName: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: "400",
    marginTop: 8,
  },
  scoreCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 32,
    paddingVertical: 18,
  },
  scoreBlock: {
    alignItems: "center",
    flex: 1,
  },
  scoreValue: {
    color: palette.ink,
    fontSize: 26,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
  },
  scoreLabel: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "400",
    marginTop: 4,
  },
  scoreDivider: {
    backgroundColor: palette.border,
    width: 1,
  },
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 11,
  },
  sectionIcon: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    marginRight: 7,
    width: 24,
  },
  sectionTitle: {
    color: palette.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  sectionCount: {
    color: palette.subtle,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "400",
  },
  resultList: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  resultRow: {
    alignItems: "center",
    borderBottomColor: palette.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 50,
  },
  resultText: {
    color: palette.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  emptyText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
    paddingVertical: 18,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: palette.ink,
    borderRadius: 14,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    minHeight: 56,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: palette.borderStrong,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 52,
  },
  secondaryButtonText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "500",
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});
