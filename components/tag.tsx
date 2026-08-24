import { StyleSheet, Text, View } from "react-native";

import { palette } from "@/constants/palette";

type TagProperties = {
  title: string;
  color?: string;
};

export default function Tag({ title, color = palette.surface }: TagProperties) {
  return (
    <View style={[styles.tag, { backgroundColor: color }]}>
      <Text style={styles.label}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: "flex-start",
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: "500",
  },
});
