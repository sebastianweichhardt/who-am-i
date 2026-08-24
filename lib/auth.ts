import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";

export async function signInWithApple() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  if (Platform.OS !== "ios" || !(await AppleAuthentication.isAvailableAsync())) {
    throw new Error("Sign in with Apple is only available on supported Apple devices.");
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error("Apple did not return a valid identity token.");
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });

  if (error) throw error;

  const hasName = Object.values(credential.fullName ?? {}).some(Boolean);
  if (hasName) {
    const fullName = AppleAuthentication.formatFullName(credential.fullName!);
    await supabase.auth.updateUser({
      data: {
        family_name: credential.fullName?.familyName,
        full_name: fullName,
        given_name: credential.fullName?.givenName,
      },
    });
  }

  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw error;
}

export function isAppleSignInCanceled(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ERR_REQUEST_CANCELED"
  );
}
