import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";

import { supabase } from "@/lib/supabase";

export type ThemeIcon = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type GameTheme = {
  id: string;
  title: string;
  description: string;
  icon: ThemeIcon;
  color: string;
  accent: string;
  prompts: string[];
};

let themeCache: GameTheme[] | null = null;
let customThemeCache: { themes: GameTheme[]; userId: string } | null = null;

const CUSTOM_THEME_APPEARANCE = {
  accent: "#E8E4DD",
  color: "#8D857A",
  icon: "cards-outline" as ThemeIcon,
};

export async function fetchThemes(forceRefresh = false): Promise<GameTheme[]> {
  if (!forceRefresh && themeCache) return themeCache;
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add the project URL and publishable key to .env.local.",
    );
  }

  const [themesResponse, promptsResponse] = await Promise.all([
    supabase
      .from("themes")
      .select("id, title, description, icon, color, accent, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("theme_prompts")
      .select("theme_id, prompt, sort_order")
      .order("sort_order"),
  ]);

  if (themesResponse.error) throw themesResponse.error;
  if (promptsResponse.error) throw promptsResponse.error;

  const promptsByTheme = new Map<string, string[]>();
  for (const row of promptsResponse.data) {
    const prompts = promptsByTheme.get(row.theme_id) ?? [];
    prompts.push(row.prompt);
    promptsByTheme.set(row.theme_id, prompts);
  }

  themeCache = themesResponse.data.map((row) => ({
    accent: row.accent,
    color: row.color,
    description: row.description,
    icon: row.icon as ThemeIcon,
    id: row.id,
    prompts: promptsByTheme.get(row.id) ?? [],
    title: row.title,
  }));

  return themeCache;
}

export async function fetchTheme(id: string): Promise<GameTheme | null> {
  const themes = await fetchThemes();
  const officialTheme = themes.find((theme) => theme.id === id);
  if (officialTheme) return officialTheme;

  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add the project URL and publishable key to .env.local.",
    );
  }

  const { data: theme, error: themeError } = await supabase
    .from("custom_themes")
    .select("id, title, description")
    .eq("id", id)
    .maybeSingle();

  if (themeError) throw themeError;
  if (!theme) return null;

  const { data: entries, error: entriesError } = await supabase
    .from("custom_theme_entries")
    .select("prompt, sort_order")
    .eq("theme_id", id)
    .order("sort_order");

  if (entriesError) throw entriesError;

  return {
    ...CUSTOM_THEME_APPEARANCE,
    description: theme.description || "A theme made by you",
    id: theme.id,
    prompts: entries.map((entry) => entry.prompt),
    title: theme.title,
  };
}

export async function fetchCustomThemes(
  userId: string,
  forceRefresh = false,
): Promise<GameTheme[]> {
  if (
    !forceRefresh &&
    customThemeCache &&
    customThemeCache.userId === userId
  ) {
    return customThemeCache.themes;
  }

  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add the project URL and publishable key to .env.local.",
    );
  }

  const { data: themes, error: themesError } = await supabase
    .from("custom_themes")
    .select("id, title, description, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (themesError) throw themesError;
  if (themes.length === 0) {
    customThemeCache = { themes: [], userId };
    return [];
  }

  const themeIds = themes.map((theme) => theme.id);
  const { data: entries, error: entriesError } = await supabase
    .from("custom_theme_entries")
    .select("theme_id, prompt, sort_order")
    .in("theme_id", themeIds)
    .order("sort_order");

  if (entriesError) throw entriesError;

  const entriesByTheme = new Map<string, string[]>();
  for (const entry of entries) {
    const themeEntries = entriesByTheme.get(entry.theme_id) ?? [];
    themeEntries.push(entry.prompt);
    entriesByTheme.set(entry.theme_id, themeEntries);
  }

  const customThemes = themes.map((theme) => ({
    ...CUSTOM_THEME_APPEARANCE,
    description: theme.description || "A theme made by you",
    id: theme.id,
    prompts: entriesByTheme.get(theme.id) ?? [],
    title: theme.title,
  }));

  customThemeCache = { themes: customThemes, userId };
  return customThemes;
}

export async function createCustomTheme(input: {
  description: string;
  entries: string[];
  title: string;
}): Promise<string> {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add the project URL and publishable key to .env.local.",
    );
  }

  const { data, error } = await supabase.rpc("create_custom_theme", {
    p_description: input.description,
    p_entries: input.entries,
    p_title: input.title,
  });

  if (error) throw error;
  clearCustomThemeCache();
  return data;
}

export function clearThemeCache() {
  themeCache = null;
}

export function clearCustomThemeCache() {
  customThemeCache = null;
}
