import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Card from "@/components/card";
import { palette } from "@/constants/palette";
import { THEMES } from "@/data/themes";

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
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

        <View style={styles.grid}>
          {THEMES.map((theme) => (
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
  tipText: {
    color: palette.subtle,
    fontSize: 12,
    fontWeight: "400",
    marginTop: 20,
    textAlign: "center",
  },
});
