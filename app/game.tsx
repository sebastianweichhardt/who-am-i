import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ScreenOrientation from "expo-screen-orientation";
import type { Href } from "expo-router";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DeviceMotion, DeviceMotionMeasurement } from "expo-sensors";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { palette } from "@/constants/palette";
import { getTheme } from "@/data/themes";

export type GuessResult = {
  prompt: string;
  correct: boolean;
};

type GamePhase = "ready" | "countdown" | "playing" | "finished";
type MotionStatus = "idle" | "active" | "denied" | "unavailable";

const ROUND_SECONDS = 60;
const TILT_THRESHOLD = 0.55;
const NEUTRAL_THRESHOLD = 0.22;
const ACTION_COOLDOWN_MS = 900;

export default function GameScreen() {
  const { theme: themeParam } = useLocalSearchParams<{ theme?: string }>();
  const router = useRouter();
  const theme = getTheme(themeParam);

  const [phase, setPhase] = useState<GamePhase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [remaining, setRemaining] = useState(ROUND_SECONDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<GuessResult[]>([]);
  const [motionStatus, setMotionStatus] = useState<MotionStatus>("idle");

  const phaseRef = useRef<GamePhase>("ready");
  const indexRef = useRef(0);
  const resultsRef = useRef<GuessResult[]>([]);
  const baselineRef = useRef<number | null>(null);
  const armedRef = useRef(true);
  const lastActionRef = useRef(0);
  const subscriptionRef = useRef<ReturnType<typeof DeviceMotion.addListener> | null>(null);

  useEffect(() => {
    void ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT,
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
      if (phaseRef.current === "finished") return;

      setGamePhase("finished");
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      router.replace({
        pathname: "/results",
        params: {
          results: JSON.stringify(finalResults),
          theme: theme.id,
        },
      } as unknown as Href);
    },
    [router, setGamePhase, theme.id],
  );

  const registerGuess = useCallback(
    (correct: boolean) => {
      if (phaseRef.current !== "playing") return;

      const now = Date.now();
      if (now - lastActionRef.current < ACTION_COOLDOWN_MS) return;
      lastActionRef.current = now;
      armedRef.current = false;

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
    [finishGame, theme.prompts],
  );

  const handleMotion = useCallback(
    ({ orientation, rotation }: DeviceMotionMeasurement) => {
      const axis = Math.abs(orientation) === 90 ? rotation?.gamma : rotation?.beta;
      if (typeof axis !== "number") return;

      if (phaseRef.current === "countdown") {
        baselineRef.current =
          baselineRef.current === null
            ? axis
            : baselineRef.current * 0.82 + axis * 0.18;
        return;
      }

      if (phaseRef.current !== "playing") return;
      if (baselineRef.current === null) baselineRef.current = axis;

      const rawTilt = axis - (baselineRef.current ?? axis);
      const tilt = orientation === 90 ? -rawTilt : rawTilt;
      if (!armedRef.current) {
        if (Math.abs(tilt) < NEUTRAL_THRESHOLD) armedRef.current = true;
        return;
      }

      if (tilt > TILT_THRESHOLD) registerGuess(true);
      if (tilt < -TILT_THRESHOLD) registerGuess(false);
    },
    [registerGuess],
  );

  const beginCountdown = useCallback(async () => {
    setCountdown(3);
    setRemaining(ROUND_SECONDS);
    baselineRef.current = null;
    armedRef.current = true;

    try {
      const available = await DeviceMotion.isAvailableAsync();
      if (!available) {
        setMotionStatus("unavailable");
      } else {
        const permission = await DeviceMotion.requestPermissionsAsync();
        if (!permission.granted) {
          setMotionStatus("denied");
        } else {
          if (Platform.OS !== "web") DeviceMotion.setUpdateInterval(200);
          subscriptionRef.current?.remove();
          subscriptionRef.current = DeviceMotion.addListener(handleMotion);
          setMotionStatus("active");
        }
      }
    } catch {
      setMotionStatus("unavailable");
    }

    setGamePhase("countdown");
  }, [handleMotion, setGamePhase]);

  useEffect(() => {
    if (phase !== "countdown") return;

    const interval = setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          lastActionRef.current = Date.now();
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

  useEffect(
    () => () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    },
    [],
  );

  const score = results.filter((result) => result.correct).length;
  const currentPrompt = theme.prompts[currentIndex];

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

        <View style={styles.readyContent}>
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
                icon="rotate-3d-variant"
                label="Tilt forward"
                value="Got it"
              />
              <View style={styles.instructionDivider} />
              <Instruction
                color={palette.ink}
                icon="rotate-3d-variant"
                label="Tilt backward"
                value="Pass"
              />
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
            <Text style={styles.roundMeta}>60 seconds · {theme.prompts.length} prompts</Text>
          </View>
        </View>
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
          <Text style={styles.countdownLabel}>Get ready!</Text>
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
              <View style={[styles.themeBar, { backgroundColor: theme.color }]} />
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

          <View style={styles.tiltHints}>
            <View style={styles.tiltHint}>
              <MaterialCommunityIcons color={palette.ink} name="arrow-down" size={17} />
              <Text style={styles.tiltHintText}>Forward = correct</Text>
            </View>
            <View style={styles.tiltHint}>
              <MaterialCommunityIcons color={palette.ink} name="arrow-up" size={17} />
              <Text style={styles.tiltHintText}>Back = pass</Text>
            </View>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable
            accessibilityLabel="Pass"
            accessibilityRole="button"
            onPress={() => registerGuess(false)}
            style={({ pressed }) => [
              styles.controlButton,
              styles.passButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <MaterialCommunityIcons color={palette.ink} name="close" size={23} />
            <Text style={[styles.controlText, styles.passText]}>Pass</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Correct"
            accessibilityRole="button"
            onPress={() => registerGuess(true)}
            style={({ pressed }) => [
              styles.controlButton,
              styles.correctButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <MaterialCommunityIcons color="#FFFFFF" name="check" size={23} />
            <Text style={[styles.controlText, styles.correctText]}>Correct</Text>
          </Pressable>
          {motionStatus !== "active" && (
            <Text style={styles.motionFallback}>
              Tilt unavailable — use buttons
            </Text>
          )}
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
  icon: "rotate-3d-variant";
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
    flex: 1,
    flexDirection: "row",
    gap: 44,
    justifyContent: "center",
    paddingBottom: 18,
    paddingHorizontal: 40,
  },
  readyIntro: {
    alignItems: "flex-start",
    flex: 1,
    maxWidth: 360,
  },
  readyActions: {
    alignItems: "center",
    flex: 1,
    maxWidth: 440,
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
    textAlign: "left",
  },
  readySubtitle: {
    color: palette.muted,
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 350,
    textAlign: "left",
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
  },
  playArea: {
    flex: 1,
    flexDirection: "row",
    gap: 18,
    paddingBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  deckLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 7,
  },
  cardStack: {
    height: 210,
    maxWidth: 520,
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
  themeBar: {
    borderRadius: 2,
    height: 4,
    left: 22,
    position: "absolute",
    right: 22,
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
  tiltHints: {
    flexDirection: "row",
    gap: 18,
    marginTop: 11,
  },
  tiltHint: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  tiltHintText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "400",
  },
  controls: {
    alignSelf: "stretch",
    gap: 10,
    justifyContent: "center",
    paddingLeft: 2,
    width: 150,
  },
  controlButton: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 62,
    width: "100%",
  },
  passButton: {
    backgroundColor: palette.surface,
    borderColor: palette.borderStrong,
    borderWidth: 1,
  },
  correctButton: {
    backgroundColor: palette.ink,
  },
  controlText: {
    fontSize: 15,
    fontWeight: "600",
  },
  passText: {
    color: palette.ink,
  },
  correctText: {
    color: "#FFFFFF",
  },
  motionFallback: {
    color: palette.subtle,
    fontSize: 10,
    fontWeight: "400",
    lineHeight: 13,
    paddingTop: 2,
    textAlign: "center",
  },
});
