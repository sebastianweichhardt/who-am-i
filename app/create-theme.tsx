import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { palette } from "@/constants/palette";
import { createCustomTheme } from "@/data/themes";
import { useAuth } from "@/providers/auth-provider";

const MAX_ENTRIES = 100;

export default function CreateThemeScreen() {
  const router = useRouter();
  const { isLoading: isAuthLoading, session } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [entries, setEntries] = useState([""]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedEntries = useMemo(
    () => entries.map((entry) => entry.trim()).filter(Boolean),
    [entries],
  );
  const canSave =
    Boolean(session) && title.trim().length > 0 && normalizedEntries.length > 0;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const updateEntry = (index: number, value: string) => {
    setEntries((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? value : entry,
      ),
    );
  };

  const addEntry = () => {
    if (entries.length >= MAX_ENTRIES) return;
    setEntries((current) => [...current, ""]);
  };

  const removeEntry = (index: number) => {
    setEntries((current) => {
      if (current.length === 1) return [""];
      return current.filter((_, entryIndex) => entryIndex !== index);
    });
  };

  const handleSave = async () => {
    if (!session || !canSave || isSaving) return;

    const uniqueEntries = new Set(
      normalizedEntries.map((entry) => entry.toLocaleLowerCase()),
    );
    if (uniqueEntries.size !== normalizedEntries.length) {
      setErrorMessage("Each entry needs to be unique.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await createCustomTheme({
        description: description.trim(),
        entries: normalizedEntries,
        title: title.trim(),
      });
      if (router.canGoBack()) router.back();
      else router.replace("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save this theme.",
      );
    } finally {
      setIsSaving(false);
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
        <Text style={styles.headerTitle}>Create theme</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isAuthLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator color={palette.ink} />
        </View>
      ) : !session ? (
        <View style={styles.centeredState}>
          <View style={styles.lockIcon}>
            <MaterialCommunityIcons
              color={palette.ink}
              name="account-lock-outline"
              size={30}
            />
          </View>
          <Text style={styles.stateTitle}>Sign in to create</Text>
          <Text style={styles.stateDescription}>
            Your custom themes are private and saved to your account.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/account" as Href)}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Continue with Apple</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.intro}>
              <Text style={styles.title}>Make it yours.</Text>
              <Text style={styles.subtitle}>
                Name the theme, then add the words or people your friends need to guess.
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Theme name</Text>
              <TextInput
                autoCapitalize="sentences"
                autoCorrect
                maxLength={80}
                onChangeText={setTitle}
                placeholder="Weekend trip"
                placeholderTextColor={palette.subtle}
                returnKeyType="next"
                style={styles.input}
                value={title}
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Description</Text>
                <Text style={styles.optionalLabel}>Optional</Text>
              </View>
              <TextInput
                autoCapitalize="sentences"
                autoCorrect
                maxLength={160}
                onChangeText={setDescription}
                placeholder="Inside jokes from our summer holiday"
                placeholderTextColor={palette.subtle}
                style={styles.input}
                value={description}
              />
            </View>

            <View style={styles.entriesHeader}>
              <View>
                <Text style={styles.label}>Entries</Text>
                <Text style={styles.entriesHint}>Add at least one to save.</Text>
              </View>
              <Text style={styles.entryCount}>{normalizedEntries.length}</Text>
            </View>

            <View style={styles.entryList}>
              {entries.map((entry, index) => (
                <View key={index} style={styles.entryRow}>
                  <Text style={styles.entryNumber}>{index + 1}</Text>
                  <TextInput
                    autoCapitalize="words"
                    autoCorrect
                    maxLength={120}
                    onChangeText={(value) => updateEntry(index, value)}
                    onSubmitEditing={
                      index === entries.length - 1 ? addEntry : undefined
                    }
                    placeholder="Add a person, place or thing"
                    placeholderTextColor={palette.subtle}
                    returnKeyType={
                      index === entries.length - 1 ? "next" : "done"
                    }
                    style={styles.entryInput}
                    value={entry}
                  />
                  <Pressable
                    accessibilityLabel={`Remove entry ${index + 1}`}
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => removeEntry(index)}
                    style={({ pressed }) => [
                      styles.removeButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialCommunityIcons
                      color={palette.muted}
                      name="close"
                      size={18}
                    />
                  </Pressable>
                </View>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={entries.length >= MAX_ENTRIES}
              onPress={addEntry}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.pressed,
                entries.length >= MAX_ENTRIES && styles.disabled,
              ]}
            >
              <MaterialCommunityIcons color={palette.ink} name="plus" size={19} />
              <Text style={styles.addButtonText}>Add entry</Text>
            </Pressable>

            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <Pressable
              accessibilityRole="button"
              disabled={!canSave || isSaving}
              onPress={() => void handleSave()}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
                (!canSave || isSaving) && styles.disabled,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Save theme</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 38,
  },
  intro: {
    marginBottom: 32,
    maxWidth: 520,
  },
  title: {
    color: palette.ink,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -1,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 420,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  optionalLabel: {
    color: palette.subtle,
    fontSize: 11,
    marginBottom: 8,
  },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 15,
  },
  entriesHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  entriesHint: {
    color: palette.muted,
    fontSize: 11,
    marginTop: -4,
  },
  entryCount: {
    color: palette.subtle,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  entryList: {
    gap: 8,
    marginTop: 14,
  },
  entryRow: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
    paddingLeft: 13,
    paddingRight: 8,
  },
  entryNumber: {
    color: palette.subtle,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    width: 28,
  },
  entryInput: {
    color: palette.ink,
    flex: 1,
    fontSize: 14,
    minHeight: 50,
    paddingVertical: 10,
  },
  removeButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  addButton: {
    alignItems: "center",
    borderColor: palette.borderStrong,
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 48,
  },
  addButtonText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: palette.ink,
    borderRadius: 13,
    justifyContent: "center",
    marginTop: 24,
    minHeight: 54,
    paddingHorizontal: 22,
    width: "100%",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    color: palette.danger,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
    textAlign: "center",
  },
  centeredState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 70,
    paddingHorizontal: 24,
  },
  lockIcon: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 30,
    borderWidth: 1,
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  stateTitle: {
    color: palette.ink,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginTop: 20,
  },
  stateDescription: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    maxWidth: 320,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
