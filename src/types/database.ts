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
      application_statuses: {
        Row: {
          id: string
          code: string
          name: string
          sort_order: number
          is_terminal: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          sort_order: number
          is_terminal?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['application_statuses']['Insert']>
        Relationships: []
      }
      application_study_details: {
        Row: {
          id: string
          application_id: string
          institution_id: string | null
          institution_name: string | null
          course_id: string | null
          proposed_course: string | null
          duration_months: number | null
          year_of_study: number | null
          total_course_fee: string | null
          tuition_fee: string | null
          currency: string
          student_type: 'new' | 'continuing'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          institution_id?: string | null
          institution_name?: string | null
          course_id?: string | null
          proposed_course?: string | null
          duration_months?: number | null
          year_of_study?: number | null
          total_course_fee?: string | null
          tuition_fee?: string | null
          currency?: string
          student_type: 'new' | 'continuing'
          created_at?: string
          updated_at?: string
        }
        Update: Partial<
          Database['public']['Tables']['application_study_details']['Insert']
        >
        Relationships: []
      }
      application_documents: {
        Row: {
          id: string
          application_id: string
          applicant_id: string
          document_type_id: string
          original_filename: string
          mime_type: string
          file_size_bytes: number
          storage_provider: string
          storage_object_key: string
          status:
            | 'missing'
            | 'uploaded'
            | 'under_review'
            | 'verified'
            | 'rejected'
            | 'replacement_requested'
          uploaded_by: string | null
          verified_by: string | null
          verified_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          applicant_id: string
          document_type_id: string
          original_filename: string
          mime_type: string
          file_size_bytes: number
          storage_provider?: string
          storage_object_key: string
          status?:
            | 'missing'
            | 'uploaded'
            | 'under_review'
            | 'verified'
            | 'rejected'
            | 'replacement_requested'
          uploaded_by?: string | null
          verified_by?: string | null
          verified_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['application_documents']['Insert']>
        Relationships: []
      }
      application_status_history: {
        Row: {
          id: string
          application_id: string
          previous_status_id: string | null
          new_status_id: string
          changed_by: string | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          previous_status_id?: string | null
          new_status_id: string
          changed_by?: string | null
          reason?: string | null
          created_at?: string
        }
        Update: Partial<
          Database['public']['Tables']['application_status_history']['Insert']
        >
        Relationships: []
      }
      applications: {
        Row: {
          id: string
          applicant_id: string
          grant_program_id: string
          status_id: string
          application_number: string | null
          sequence_number: number | null
          additional_information: string | null
          submitted_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          applicant_id: string
          grant_program_id: string
          status_id: string
          application_number?: string | null
          sequence_number?: number | null
          additional_information?: string | null
          submitted_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['applications']['Insert']>
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
      education_history: {
        Row: {
          id: string
          applicant_id: string
          education_level: 'secondary' | 'tertiary' | 'other'
          grade_level: string | null
          school_name: string | null
          course: string | null
          institution_id: string | null
          year_graduated: number | null
          award: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          applicant_id: string
          education_level: 'secondary' | 'tertiary' | 'other'
          grade_level?: string | null
          school_name?: string | null
          course?: string | null
          institution_id?: string | null
          year_graduated?: number | null
          award?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['education_history']['Insert']>
        Relationships: []
      }
      document_types: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['document_types']['Insert']>
        Relationships: []
      }
      grant_programs: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          program_year: number
          opening_date: string | null
          closing_date: string | null
          status: string
          base_currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          program_year: number
          opening_date?: string | null
          closing_date?: string | null
          status?: string
          base_currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['grant_programs']['Insert']>
        Relationships: []
      }
      program_document_requirements: {
        Row: {
          id: string
          grant_program_id: string
          document_type_id: string
          requirement_level: 'required' | 'optional' | 'conditional'
          student_type: 'all' | 'new' | 'continuing'
          condition_data: Json
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          grant_program_id: string
          document_type_id: string
          requirement_level: 'required' | 'optional' | 'conditional'
          student_type?: 'all' | 'new' | 'continuing'
          condition_data?: Json
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<
          Database['public']['Tables']['program_document_requirements']['Insert']
        >
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
      submit_application: {
        Args: {
          application_id_input: string
          declaration_text_input: string
        }
        Returns: Database['public']['Tables']['applications']['Row']
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
