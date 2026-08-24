import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { palette } from "@/constants/palette";
import {
  isAppleSignInCanceled,
  signInWithApple,
  signOut,
} from "@/lib/auth";
import { useAuth } from "@/providers/auth-provider";

export default function AccountScreen() {
  const router = useRouter();
  const { isLoading, session } = useAuth();
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const user = session?.user;
  const displayName = useMemo(() => {
    const fullName = user?.user_metadata?.full_name;
    if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
    return "Apple user";
  }, [user]);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    void AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable);
  }, []);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const handleAppleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await signInWithApple();
    } catch (error) {
      if (!isAppleSignInCanceled(error)) {
        setErrorMessage(
          error instanceof Error ? error.message : "Apple sign-in failed.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await signOut();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign out.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          hitSlop={12}
          onPress={goBack}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons color={palette.ink} name="arrow-left" size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={palette.ink} />
          </View>
        ) : user ? (
          <View style={styles.accountContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.title}>{displayName}</Text>
            <Text style={styles.subtitle}>Signed in with Apple</Text>

            <View style={styles.detailsCard}>
              <DetailRow label="Name" value={displayName} />
              <View style={styles.divider} />
              <DetailRow label="Email" value={user.email ?? "Hidden by Apple"} />
            </View>

            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => void handleSignOut()}
              style={({ pressed }) => [
                styles.signOutButton,
                pressed && styles.pressed,
                isSubmitting && styles.disabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={palette.ink} size="small" />
              ) : (
                <Text style={styles.signOutText}>Sign out</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.signedOutContent}>
            <View style={styles.accountIcon}>
              <MaterialCommunityIcons
                color={palette.ink}
                name="account-outline"
                size={34}
              />
            </View>
            <Text style={styles.title}>Your account</Text>
            <Text style={styles.signedOutSubtitle}>
              Sign in to create your account and keep your identity connected to the game.
            </Text>

            <View style={styles.signInArea}>
              {isSubmitting ? (
                <View style={styles.appleLoadingButton}>
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : isAppleAvailable ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  cornerRadius={12}
                  onPress={() => void handleAppleSignIn()}
                  style={styles.appleButton}
                />
              ) : (
                <Text style={styles.unavailableText}>
                  Sign in with Apple is available on supported iPhones and iPads.
                </Text>
              )}
            </View>

            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            <Text style={styles.privacyText}>
              Apple lets you choose whether to share or hide your email address.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.background,
    flex: 1,
  },
  header: {
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
  headerTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 42,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  loadingState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 420,
  },
  accountContent: {
    alignItems: "center",
    paddingTop: 62,
  },
  signedOutContent: {
    alignItems: "center",
    paddingTop: 72,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: palette.ink,
    borderRadius: 34,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
  },
  accountIcon: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 34,
    borderWidth: 1,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  title: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.7,
    marginTop: 20,
    textAlign: "center",
  },
  subtitle: {
    color: palette.muted,
    fontSize: 13,
    marginTop: 7,
  },
  signedOutSubtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 340,
    textAlign: "center",
  },
  detailsCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 36,
    maxWidth: 520,
    paddingHorizontal: 16,
    width: "100%",
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 54,
  },
  detailLabel: {
    color: palette.muted,
    fontSize: 13,
    width: 58,
  },
  detailValue: {
    color: palette.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
  },
  divider: {
    backgroundColor: palette.border,
    height: StyleSheet.hairlineWidth,
  },
  signInArea: {
    marginTop: 32,
    maxWidth: 420,
    width: "100%",
  },
  appleButton: {
    height: 52,
    width: "100%",
  },
  appleLoadingButton: {
    alignItems: "center",
    backgroundColor: "#000000",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    width: "100%",
  },
  unavailableText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  privacyText: {
    color: palette.subtle,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 18,
    maxWidth: 320,
    textAlign: "center",
  },
  errorText: {
    color: palette.danger,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
    maxWidth: 420,
    textAlign: "center",
  },
  signOutButton: {
    alignItems: "center",
    borderColor: palette.borderStrong,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 20,
    minHeight: 50,
    maxWidth: 520,
    width: "100%",
  },
  signOutText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
