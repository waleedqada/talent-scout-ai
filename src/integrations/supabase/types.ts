export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      candidate_rankings: {
        Row: {
          candidate_id: string | null
          created_at: string | null
          id: string
          job_requirement_id: string | null
          match_score: number | null
          matched_skills: string[] | null
          missing_skills: string[] | null
          recommendation: string | null
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string | null
          id?: string
          job_requirement_id?: string | null
          match_score?: number | null
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          recommendation?: string | null
        }
        Update: {
          candidate_id?: string | null
          created_at?: string | null
          id?: string
          job_requirement_id?: string | null
          match_score?: number | null
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          recommendation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_rankings_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_rankings_job_requirement_id_fkey"
            columns: ["job_requirement_id"]
            isOneToOne: false
            referencedRelation: "job_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_skills: {
        Row: {
          candidate_id: string | null
          created_at: string | null
          id: string
          proficiency_level: string | null
          skill_category: string | null
          skill_name: string
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string | null
          id?: string
          proficiency_level?: string | null
          skill_category?: string | null
          skill_name: string
        }
        Update: {
          candidate_id?: string | null
          created_at?: string | null
          id?: string
          proficiency_level?: string | null
          skill_category?: string | null
          skill_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_skills_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          created_at: string | null
          education: string | null
          email: string | null
          full_name: string
          id: string
          location: string | null
          phone: string | null
          resume_filename: string | null
          resume_url: string | null
          status: string | null
          summary: string | null
          updated_at: string | null
          years_of_experience: number | null
        }
        Insert: {
          created_at?: string | null
          education?: string | null
          email?: string | null
          full_name: string
          id?: string
          location?: string | null
          phone?: string | null
          resume_filename?: string | null
          resume_url?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
          years_of_experience?: number | null
        }
        Update: {
          created_at?: string | null
          education?: string | null
          email?: string | null
          full_name?: string
          id?: string
          location?: string | null
          phone?: string | null
          resume_filename?: string | null
          resume_url?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      job_requirements: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          job_title: string
          required_experience_years: number | null
          required_skills: string[]
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          job_title: string
          required_experience_years?: number | null
          required_skills: string[]
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          job_title?: string
          required_experience_years?: number | null
          required_skills?: string[]
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      work_experiences: {
        Row: {
          candidate_id: string | null
          company_name: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          position: string
          start_date: string | null
        }
        Insert: {
          candidate_id?: string | null
          company_name: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          position: string
          start_date?: string | null
        }
        Update: {
          candidate_id?: string | null
          company_name?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          position?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_experiences_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
