import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ScreenOrientation from "expo-screen-orientation";
import type { Href } from "expo-router";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ThemeLoadState from "@/components/theme-load-state";
import { palette } from "@/constants/palette";
import { fetchTheme, type GameTheme } from "@/data/themes";

export type GuessResult = {
  prompt: string;
  correct: boolean;
};

type GamePhase = "ready" | "countdown" | "playing" | "finished";

const DEFAULT_ROUND_SECONDS = 60;
const ROUND_OPTIONS = [30, 60, 90] as const;
const TAP_COOLDOWN_MS = 220;

export default function GameScreen() {
  const { theme: themeParam } = useLocalSearchParams<{ theme?: string }>();
  const router = useRouter();

  const [theme, setTheme] = useState<GameTheme | null>(null);
  const [themeError, setThemeError] = useState<string | null>(null);
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [roundSeconds, setRoundSeconds] = useState(DEFAULT_ROUND_SECONDS);
  const [remaining, setRemaining] = useState(DEFAULT_ROUND_SECONDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<GuessResult[]>([]);

  const phaseRef = useRef<GamePhase>("ready");
  const indexRef = useRef(0);
  const resultsRef = useRef<GuessResult[]>([]);
  const lastTapAtRef = useRef(0);

  const loadTheme = useCallback(async () => {
    setTheme(null);
    setThemeError(null);

    if (!themeParam) {
      setThemeError("No theme was selected.");
      return;
    }

    try {
      const nextTheme = await fetchTheme(themeParam);
      if (!nextTheme) {
        setThemeError("This theme is unavailable or no longer active.");
        return;
      }
      if (nextTheme.prompts.length === 0) {
        setThemeError("This theme does not have any prompts yet.");
        return;
      }
      setTheme(nextTheme);
    } catch (error) {
      setThemeError(
        error instanceof Error ? error.message : "Unable to load this theme.",
      );
    }
  }, [themeParam]);

  useEffect(() => {
    void loadTheme();
  }, [loadTheme]);

  useEffect(() => {
    void ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    ).catch(() => undefined);

    return () => {
      void ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      ).catch(() => undefined);
    };
  }, []);

  const setGamePhase = useCallback((nextPhase: GamePhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const finishGame = useCallback(
    (finalResults: GuessResult[]) => {
      if (!theme || phaseRef.current === "finished") return;

      setGamePhase("finished");
      void ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      )
        .catch(() => undefined)
        .finally(() => {
          router.replace({
            pathname: "/results",
            params: {
              results: JSON.stringify(finalResults),
              theme: theme.id,
            },
          } as unknown as Href);
        });
    },
    [router, setGamePhase, theme],
  );

  const registerGuess = useCallback(
    (correct: boolean) => {
      if (!theme || phaseRef.current !== "playing") return;

      const now = Date.now();
      if (now - lastTapAtRef.current < TAP_COOLDOWN_MS) return;
      lastTapAtRef.current = now;

      const guess: GuessResult = {
        correct,
        prompt: theme.prompts[indexRef.current],
      };
      const nextResults = [...resultsRef.current, guess];
      resultsRef.current = nextResults;
      setResults(nextResults);

      void Haptics.notificationAsync(
        correct
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );

      const nextIndex = indexRef.current + 1;
      if (nextIndex >= theme.prompts.length) {
        finishGame(nextResults);
        return;
      }

      indexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
    },
    [finishGame, theme],
  );

  const beginCountdown = useCallback(async () => {
    setCountdown(3);
    setRemaining(roundSeconds);
    lastTapAtRef.current = 0;

    setGamePhase("countdown");
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT,
    ).catch(() => undefined);
  }, [roundSeconds, setGamePhase]);

  useEffect(() => {
    if (phase !== "countdown") return;

    const interval = setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          lastTapAtRef.current = 0;
          setGamePhase("playing");
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, setGamePhase]);

  useEffect(() => {
    if (phase !== "playing") return;

    const interval = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          finishGame(resultsRef.current);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [finishGame, phase]);

  const score = results.filter((result) => result.correct).length;
  const currentPrompt = theme?.prompts[currentIndex];

  if (!theme) {
    return (
      <ThemeLoadState
        errorMessage={themeError}
        onBack={() => router.replace("/")}
        onRetry={() => void loadTheme()}
      />
    );
  }

  if (phase === "ready") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.readyHeader}>
          <Pressable
            accessibilityLabel="Back to themes"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons color={palette.ink} name="arrow-left" size={22} />
          </Pressable>
          <Text style={styles.readyHeaderTitle}>Get ready</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.readyContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.readyIntro}>
            <View style={[styles.deckIcon, { backgroundColor: theme.accent }]}>
              <MaterialCommunityIcons color={palette.ink} name={theme.icon} size={28} />
            </View>
            <Text style={styles.readyTitle}>{theme.title}</Text>
            <Text style={styles.readySubtitle}>
              Hold your phone horizontally against your forehead, screen facing your friends.
            </Text>
          </View>
          <View style={styles.readyActions}>
            <View style={styles.instructions}>
              <Instruction
                color={palette.ink}
                icon="arrow-left"
                label="Tap left"
                value="Incorrect"
              />
              <View style={styles.instructionDivider} />
              <Instruction
                color={palette.ink}
                icon="arrow-right"
                label="Tap right"
                value="Correct"
              />
            </View>

            <View style={styles.durationSection}>
              <Text style={styles.durationLabel}>Round time</Text>
              <View style={styles.durationOptions}>
                {ROUND_OPTIONS.map((seconds) => {
                  const selected = seconds === roundSeconds;

                  return (
                    <Pressable
                      accessibilityLabel={`${seconds} seconds`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={seconds}
                      onPress={() => setRoundSeconds(seconds)}
                      style={({ pressed }) => [
                        styles.durationOption,
                        selected && styles.durationOptionSelected,
                        pressed && styles.durationOptionPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.durationOptionText,
                          selected && styles.durationOptionTextSelected,
                        ]}
                      >
                        {seconds}s
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={beginCountdown}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Start round</Text>
              <MaterialCommunityIcons color="#FFFFFF" name="arrow-right" size={20} />
            </Pressable>
            <Text style={styles.roundMeta}>{theme.prompts.length} prompts</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === "countdown") {
    return (
      <SafeAreaView style={styles.countdownScreen}>
        <StatusBar style="light" />
        <View style={styles.countdownContent}>
          <Text style={styles.countdownKicker}>Phone on your forehead</Text>
          <Text style={styles.countdownNumber}>{countdown}</Text>
          <Text style={styles.countdownLabel}>Tap either side to answer</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.gameHeader}>
        <View style={styles.scorePill}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreText}>{score}</Text>
        </View>

        <View
          accessibilityLabel={`${remaining} seconds remaining`}
          style={[
            styles.timer,
            remaining <= 10 && styles.timerUrgent,
          ]}
        >
          <Text style={styles.timerValue}>{remaining}</Text>
          <Text style={styles.timerUnit}>SEC</Text>
        </View>

        <Pressable
          accessibilityLabel="End round"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => finishGame(resultsRef.current)}
          style={styles.endButton}
        >
          <MaterialCommunityIcons color={palette.ink} name="close" size={21} />
        </Pressable>
      </View>

      <View style={styles.playArea}>
        <View style={styles.gameContent}>
          <Text style={styles.deckLabel}>{theme.title}</Text>
          <View style={styles.cardStack}>
            <View
              style={[
                styles.stackCard,
                styles.stackCardBack,
                { backgroundColor: theme.accent },
              ]}
            />
            <View style={[styles.stackCard, styles.stackCardMiddle]} />
            <View style={styles.promptCard}>
              <View style={styles.promptCountPill}>
                <Text style={styles.promptCountText}>
                  {currentIndex + 1} / {theme.prompts.length}
                </Text>
              </View>
              <Text adjustsFontSizeToFit minimumFontScale={0.62} numberOfLines={2} style={styles.prompt}>
                {currentPrompt}
              </Text>
              <View style={styles.clueLine} />
              <Text style={styles.clueText}>Describe it. Don&apos;t say it.</Text>
            </View>
          </View>

          <View style={styles.tapHints}>
            <View style={styles.tapHint}>
              <MaterialCommunityIcons color={palette.ink} name="arrow-left" size={17} />
              <Text style={styles.tapHintText}>Left = incorrect</Text>
            </View>
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Right = correct</Text>
              <MaterialCommunityIcons color={palette.ink} name="arrow-right" size={17} />
            </View>
          </View>
        </View>

        <View style={styles.tapZones}>
          <Pressable
            accessibilityHint="Marks the current prompt as incorrect"
            accessibilityLabel="Incorrect"
            accessibilityRole="button"
            onPress={() => registerGuess(false)}
            style={({ pressed }) => [
              styles.tapZone,
              pressed && styles.incorrectTapZonePressed,
            ]}
          />
          <Pressable
            accessibilityHint="Marks the current prompt as correct"
            accessibilityLabel="Correct"
            accessibilityRole="button"
            onPress={() => registerGuess(true)}
            style={({ pressed }) => [
              styles.tapZone,
              pressed && styles.correctTapZonePressed,
            ]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Instruction({
  color,
  icon,
  label,
  value,
}: {
  color: string;
  icon: "arrow-left" | "arrow-right";
  label: string;
  value: string;
}) {
  return (
    <View style={styles.instructionItem}>
      <View style={styles.instructionIcon}>
        <MaterialCommunityIcons color={color} name={icon} size={24} />
      </View>
      <View style={styles.instructionCopy}>
        <Text style={styles.instructionValue}>{value}</Text>
        <Text style={styles.instructionLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.background,
    flex: 1,
  },
  countdownScreen: {
    backgroundColor: palette.ink,
    flex: 1,
  },
  readyHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  iconButton: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  readyHeaderTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 42,
  },
  readyContent: {
    alignItems: "center",
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  readyIntro: {
    alignItems: "center",
    maxWidth: 360,
    width: "100%",
  },
  readyActions: {
    alignItems: "center",
    marginTop: 28,
    maxWidth: 440,
    width: "100%",
  },
  deckIcon: {
    alignItems: "center",
    borderRadius: 15,
    height: 58,
    justifyContent: "center",
    marginBottom: 14,
    width: 58,
  },
  readyTitle: {
    color: palette.ink,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -1,
    textAlign: "center",
  },
  readySubtitle: {
    color: palette.muted,
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 350,
    textAlign: "center",
  },
  instructions: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 0,
    maxWidth: 460,
    padding: 14,
    width: "100%",
  },
  instructionItem: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  instructionIcon: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  instructionCopy: {
    flex: 1,
  },
  instructionValue: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  instructionLabel: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "400",
    marginTop: 2,
  },
  instructionDivider: {
    backgroundColor: palette.border,
    marginHorizontal: 10,
    width: 1,
  },
  durationSection: {
    marginTop: 16,
    maxWidth: 460,
    width: "100%",
  },
  durationLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
  },
  durationOptions: {
    backgroundColor: "#E9E8E3",
    borderRadius: 12,
    flexDirection: "row",
    padding: 3,
  },
  durationOption: {
    alignItems: "center",
    borderRadius: 9,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  durationOptionSelected: {
    backgroundColor: palette.ink,
  },
  durationOptionPressed: {
    opacity: 0.72,
  },
  durationOptionText: {
    color: palette.muted,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  durationOptionTextSelected: {
    color: "#FFFFFF",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: palette.ink,
    borderRadius: 14,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 12,
    maxWidth: 460,
    minHeight: 56,
    paddingHorizontal: 24,
    width: "100%",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  roundMeta: {
    color: palette.subtle,
    fontSize: 12,
    fontWeight: "400",
    marginTop: 14,
  },
  countdownContent: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  countdownKicker: {
    color: "#A7A7A7",
    fontSize: 13,
    fontWeight: "500",
  },
  countdownNumber: {
    color: "#FFFFFF",
    fontSize: 118,
    fontWeight: "700",
    letterSpacing: -6,
    lineHeight: 132,
  },
  countdownLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
  },
  gameHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    width: "100%",
  },
  scorePill: {
    width: 62,
  },
  scoreLabel: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "400",
  },
  scoreText: {
    color: palette.ink,
    fontSize: 19,
    fontWeight: "700",
    marginTop: 1,
  },
  timer: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
    paddingVertical: 4,
  },
  timerUrgent: {
    backgroundColor: "#F3DFDC",
    borderRadius: 10,
  },
  timerValue: {
    color: palette.ink,
    fontSize: 28,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    lineHeight: 30,
  },
  timerUnit: {
    color: palette.muted,
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  endButton: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  gameContent: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    maxWidth: 680,
    width: "100%",
  },
  playArea: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    overflow: "hidden",
    paddingBottom: 10,
    paddingHorizontal: 48,
    paddingTop: 4,
    position: "relative",
  },
  deckLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 7,
  },
  cardStack: {
    height: 224,
    maxWidth: 620,
    width: "100%",
  },
  stackCard: {
    borderColor: palette.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  stackCardBack: {
    transform: [{ rotate: "-2deg" }, { translateY: 4 }],
  },
  stackCardMiddle: {
    backgroundColor: "#ECEBE7",
    transform: [{ rotate: "1.2deg" }, { translateY: 2 }],
  },
  promptCard: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    bottom: 0,
    justifyContent: "center",
    left: 0,
    padding: 28,
    position: "absolute",
    right: 0,
    top: 0,
  },
  promptCountPill: {
    position: "absolute",
    right: 20,
    top: 18,
  },
  promptCountText: {
    color: palette.subtle,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    fontWeight: "500",
  },
  prompt: {
    color: palette.ink,
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: -1.5,
    lineHeight: 48,
    textAlign: "center",
  },
  clueLine: {
    backgroundColor: palette.borderStrong,
    height: 1,
    marginBottom: 10,
    marginTop: 16,
    width: 36,
  },
  clueText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "400",
  },
  tapHints: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 11,
    maxWidth: 620,
    width: "100%",
  },
  tapHint: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  tapHintText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "400",
  },
  tapZones: {
    bottom: 0,
    flexDirection: "row",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1,
  },
  tapZone: {
    flex: 1,
  },
  incorrectTapZonePressed: {
    backgroundColor: "rgba(196, 77, 64, 0.08)",
  },
  correctTapZonePressed: {
    backgroundColor: "rgba(23, 23, 23, 0.06)",
  },
});
