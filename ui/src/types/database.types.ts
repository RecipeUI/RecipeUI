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
      recipe: {
        Row: {
          auth: string | null
          author: string | null
          created_at: string | null
          deprecated: boolean | null
          id: number
          method: string
          options: Json | null
          path: string
          private: boolean | null
          project: string
          queryParams: Json | null
          requestBody: Json | null
          summary: string
          tags: string[] | null
          templates: Json[] | null
          title: string
          urlParams: Json | null
        }
        Insert: {
          auth?: string | null
          author?: string | null
          created_at?: string | null
          deprecated?: boolean | null
          id?: number
          method?: string
          options?: Json | null
          path: string
          private?: boolean | null
          project: string
          queryParams?: Json | null
          requestBody?: Json | null
          summary: string
          tags?: string[] | null
          templates?: Json[] | null
          title: string
          urlParams?: Json | null
        }
        Update: {
          auth?: string | null
          author?: string | null
          created_at?: string | null
          deprecated?: boolean | null
          id?: number
          method?: string
          options?: Json | null
          path?: string
          private?: boolean | null
          project?: string
          queryParams?: Json | null
          requestBody?: Json | null
          summary?: string
          tags?: string[] | null
          templates?: Json[] | null
          title?: string
          urlParams?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_project_fkey"
            columns: ["project"]
            referencedRelation: "project"
            referencedColumns: ["project"]
          }
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
