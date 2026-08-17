export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      applicants: {
        Row: {
          id: string
          profile_id: string | null
          first_name: string
          middle_name: string | null
          surname: string
          date_of_birth: string | null
          sex: string | null
          clan: string | null
          community_id: string | null
          village_id: string | null
          ward_id: string | null
          residential_address: string | null
          postal_address: string | null
          telephone: string | null
          mobile_phone: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          first_name: string
          middle_name?: string | null
          surname: string
          date_of_birth?: string | null
          sex?: string | null
          clan?: string | null
          community_id?: string | null
          village_id?: string | null
          ward_id?: string | null
          residential_address?: string | null
          postal_address?: string | null
          telephone?: string | null
          mobile_phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['applicants']['Insert']>
        Relationships: []
      }
      communities: {
        Row: {
          id: string
          name: string
          code: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['communities']['Insert']>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string | null
          full_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      current_user_role_codes: {
        Args: Record<string, never>
        Returns: string[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
