export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      project: {
        Row: {
          created_at: string | null
          description: string
          id: number
          image: string | null
          project: string
          public: boolean
          status: string
          subheader: string
          tags: string[] | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: number
          image?: string | null
          project: string
          public?: boolean
          status: string
          subheader: string
          tags?: string[] | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: number
          image?: string | null
          project?: string
          public?: boolean
          status?: string
          subheader?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: []
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
