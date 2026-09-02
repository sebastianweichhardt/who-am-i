export type Database = {
  public: {
    Tables: {
      custom_theme_entries: {
        Row: {
          created_at: string;
          id: number;
          prompt: string;
          sort_order: number;
          theme_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          prompt: string;
          sort_order: number;
          theme_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          prompt?: string;
          sort_order?: number;
          theme_id?: string;
        };
        Relationships: [];
      };
      custom_themes: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      theme_prompts: {
        Row: {
          id: number;
          prompt: string;
          sort_order: number;
          theme_id: string;
        };
        Insert: {
          id?: number;
          prompt: string;
          sort_order?: number;
          theme_id: string;
        };
        Update: {
          id?: number;
          prompt?: string;
          sort_order?: number;
          theme_id?: string;
        };
        Relationships: [];
      };
      themes: {
        Row: {
          accent: string;
          color: string;
          description: string;
          icon: string;
          id: string;
          is_active: boolean;
          sort_order: number;
          title: string;
        };
        Insert: {
          accent: string;
          color: string;
          description: string;
          icon: string;
          id: string;
          is_active?: boolean;
          sort_order?: number;
          title: string;
        };
        Update: {
          accent?: string;
          color?: string;
          description?: string;
          icon?: string;
          id?: string;
          is_active?: boolean;
          sort_order?: number;
          title?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_custom_theme: {
        Args: {
          p_description: string;
          p_entries: string[];
          p_title: string;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
