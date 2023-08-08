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
      template: {
        Row: {
          author: string
          created_at: string
          description: string
          id: number
          project: string
          queryParams: Json | null
          recipe_id: number
          requestBody: Json | null
          title: string
          urlParams: Json | null
          visibility: string
        }
        Insert: {
          author: string
          created_at?: string
          description: string
          id?: number
          project: string
          queryParams?: Json | null
          recipe_id: number
          requestBody?: Json | null
          title: string
          urlParams?: Json | null
          visibility?: string
        }
        Update: {
          author?: string
          created_at?: string
          description?: string
          id?: number
          project?: string
          queryParams?: Json | null
          recipe_id?: number
          requestBody?: Json | null
          title?: string
          urlParams?: Json | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_author_fkey"
            columns: ["author"]
            referencedRelation: "user"
            referencedColumns: ["username"]
          },
          {
            foreignKeyName: "template_project_fkey"
            columns: ["project"]
            referencedRelation: "project"
            referencedColumns: ["project"]
          },
          {
            foreignKeyName: "template_recipe_id_fkey"
            columns: ["recipe_id"]
            referencedRelation: "recipe"
            referencedColumns: ["id"]
          }
        ]
      }
      user: {
        Row: {
          company: string | null
          created_at: string
          email: string
          first: string
          hear_about: string | null
          last: string
          onboarded: boolean
          place: number
          profile_pic: string | null
          tier: string
          use_case: string | null
          user_id: string
          username: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          first: string
          hear_about?: string | null
          last: string
          onboarded?: boolean
          place?: number
          profile_pic?: string | null
          tier?: string
          use_case?: string | null
          user_id: string
          username: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          first?: string
          hear_about?: string | null
          last?: string
          onboarded?: boolean
          place?: number
          profile_pic?: string | null
          tier?: string
          use_case?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
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
