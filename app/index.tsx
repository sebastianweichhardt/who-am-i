import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  fetchCustomThemes,
  fetchThemes,
  GameTheme,
} from "@/data/themes";
import { useAuth } from "@/providers/auth-provider";

export default function Index() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;
  const customRequestRef = useRef(0);
  const [themes, setThemes] = useState<GameTheme[]>([]);
  const [customThemes, setCustomThemes] = useState<GameTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCustomLoading, setIsCustomLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customErrorMessage, setCustomErrorMessage] = useState<string | null>(null);

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

  const loadCustomThemes = useCallback(
    async (forceRefresh = false) => {
      const requestId = ++customRequestRef.current;

      if (!userId) {
        setCustomThemes([]);
        setCustomErrorMessage(null);
        setIsCustomLoading(false);
        return;
      }

      setIsCustomLoading(true);
      setCustomErrorMessage(null);

      try {
        const nextThemes = await fetchCustomThemes(userId, forceRefresh);
        if (requestId === customRequestRef.current) {
          setCustomThemes(nextThemes);
        }
      } catch (error) {
        if (requestId === customRequestRef.current) {
          setCustomErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load custom themes.",
          );
        }
      } finally {
        if (requestId === customRequestRef.current) {
          setIsCustomLoading(false);
        }
      }
    },
    [userId],
  );

  const refreshThemes = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([
      loadThemes(true),
      loadCustomThemes(true),
    ]);
    setIsRefreshing(false);
  }, [loadCustomThemes, loadThemes]);

  useEffect(() => {
    void loadThemes();
  }, [loadThemes]);

  useFocusEffect(
    useCallback(() => {
      void loadCustomThemes();
    }, [loadCustomThemes]),
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[palette.ink]}
            onRefresh={() => void refreshThemes()}
            refreshing={isRefreshing}
            tintColor={palette.ink}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.title}>Who am I?</Text>
            <Pressable
              accessibilityLabel={session ? "Open account" : "Sign in"}
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => router.push("/account" as Href)}
              style={({ pressed }) => [
                styles.accountButton,
                session && styles.accountButtonSignedIn,
                pressed && styles.accountButtonPressed,
              ]}
            >
              <MaterialCommunityIcons
                color={session ? "#FFFFFF" : palette.ink}
                name={session ? "account" : "account-outline"}
                size={20}
              />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Choose a theme. Hold the phone to your forehead. Let your friends give the clues.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Official Themes</Text>
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

        <View style={[styles.sectionHeader, styles.customSectionHeader]}>
          <Text style={styles.sectionTitle}>Custom Themes</Text>
        </View>

        <View style={styles.grid}>
          {isCustomLoading && customThemes.length === 0 ? (
            <View style={styles.customLoadingState}>
              <ActivityIndicator color={palette.ink} size="small" />
            </View>
          ) : (
            customThemes.map((theme) => (
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
            ))
          )}

          {customErrorMessage && (
            <View style={styles.customErrorCard}>
              <Text style={styles.customErrorText}>{customErrorMessage}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void loadCustomThemes(true)}
              >
                <Text style={styles.customRetryText}>Try again</Text>
              </Pressable>
            </View>
          )}

          <CreateThemePlaceholder
            isSignedIn={Boolean(session)}
            onPress={() => router.push("/create-theme" as Href)}
          />
        </View>

        <Text style={styles.tipText}>Best with two or more players.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function CreateThemePlaceholder({
  isSignedIn,
  onPress,
}: {
  isSignedIn: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel="Create a custom theme"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.createCard,
        pressed && styles.createCardPressed,
      ]}
    >
      <View style={styles.createIcon}>
        <MaterialCommunityIcons color={palette.ink} name="plus" size={23} />
      </View>
      <View style={styles.createCopy}>
        <Text style={styles.createTitle}>Create your own</Text>
        <Text style={styles.createDescription}>
          {isSignedIn
            ? "Add a theme and your own entries"
            : "Sign in to save a custom theme"}
        </Text>
      </View>
      <MaterialCommunityIcons color={palette.subtle} name="chevron-right" size={20} />
    </Pressable>
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
    paddingTop: 24,
  },
  headerTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  accountButton: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  accountButtonSignedIn: {
    backgroundColor: palette.ink,
    borderColor: palette.ink,
  },
  accountButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
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
    marginBottom: 12,
  },
  customSectionHeader: {
    marginTop: 30,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: "600",
  },
  grid: {
    gap: 10,
  },
  createCard: {
    alignItems: "center",
    borderColor: palette.borderStrong,
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  createCardPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  createIcon: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  createCopy: {
    flex: 1,
    marginLeft: 13,
  },
  createTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  createDescription: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "400",
    marginTop: 4,
  },
  customLoadingState: {
    alignItems: "center",
    minHeight: 82,
    justifyContent: "center",
  },
  customErrorCard: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  customErrorText: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  customRetryText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: "600",
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
