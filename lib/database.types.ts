export type Database = {
  public: {
    Tables: {
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
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
