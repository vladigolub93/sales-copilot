export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          full_name?: string | null;
          title?: string | null;
          email?: string | null;
          phone?: string | null;
          company_name?: string | null;
          associated_company_id?: string | null;
          linkedin?: string | null;
          personal_notes?: string | null;
          ai_insights?: string | null;
          news_feed?: unknown;
          messages?: unknown;
          created_at?: string | null;
        };
        Insert: Partial<Database['public']['Tables']['leads']['Row']>;
        Update: Partial<Database['public']['Tables']['leads']['Row']>;
      };
      companies: {
        Row: {
          id: string;
          name?: string | null;
          website?: string | null;
          linkedin?: string | null;
          description?: string | null;
          sector?: string | null;
          sub_sector?: string | null;
          employees?: number | null;
          funding_stage?: string | null;
          investment_info?: unknown;
          associated_leads?: string[] | null;
          ai_insights?: string | null;
          news_feed?: unknown;
          created_at?: string | null;
        };
        Insert: Partial<Database['public']['Tables']['companies']['Row']>;
        Update: Partial<Database['public']['Tables']['companies']['Row']>;
      };
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}
