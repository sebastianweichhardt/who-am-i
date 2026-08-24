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
  return themes.find((theme) => theme.id === id) ?? null;
}

export function clearThemeCache() {
  themeCache = null;
}
