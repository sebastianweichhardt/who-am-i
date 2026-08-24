import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { GameTheme } from "@/data/themes";
import { palette } from "@/constants/palette";

type CardProperties = {
  theme: GameTheme;
  onPress: () => void;
};

export default function Card({ theme, onPress }: CardProperties) {
  return (
    <Pressable
      accessibilityHint={`Starts a round with ${theme.prompts.length} prompts`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.icon, { backgroundColor: theme.accent }]}>
        <MaterialCommunityIcons color={palette.ink} name={theme.icon} size={22} />
      </View>

      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {theme.title}
        </Text>
        <Text numberOfLines={1} style={styles.description}>
          {theme.description}
        </Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.count}>{theme.prompts.length}</Text>
        <MaterialCommunityIcons color={palette.subtle} name="chevron-right" size={20} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  icon: {
    alignItems: "center",
    borderRadius: 12,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  copy: {
    flex: 1,
    marginLeft: 13,
  },
  title: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  description: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "400",
    marginTop: 4,
  },
  meta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
  },
  count: {
    color: palette.subtle,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
});
