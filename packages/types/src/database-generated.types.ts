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
          status: Database["public"]["Enums"]["recipeprojectstatus"]
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
          status: Database["public"]["Enums"]["recipeprojectstatus"]
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
          status?: Database["public"]["Enums"]["recipeprojectstatus"]
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
          method: Database["public"]["Enums"]["recipemethod"]
          options: Json | null
          path: string
          private: boolean | null
          project: string
          queryParams: Json | null
          rank: number | null
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
          method?: Database["public"]["Enums"]["recipemethod"]
          options?: Json | null
          path: string
          private?: boolean | null
          project: string
          queryParams?: Json | null
          rank?: number | null
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
          method?: Database["public"]["Enums"]["recipemethod"]
          options?: Json | null
          path?: string
          private?: boolean | null
          project?: string
          queryParams?: Json | null
          rank?: number | null
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
          alias: string
          author_id: string
          created_at: string
          description: string
          id: number
          original_author_id: string | null
          project: string
          queryParams: Json | null
          recipe_id: number
          replay: Json | null
          requestBody: Json | null
          title: string
          urlParams: Json | null
          visibility: string
        }
        Insert: {
          alias: string
          author_id: string
          created_at?: string
          description: string
          id?: number
          original_author_id?: string | null
          project: string
          queryParams?: Json | null
          recipe_id: number
          replay?: Json | null
          requestBody?: Json | null
          title: string
          urlParams?: Json | null
          visibility?: string
        }
        Update: {
          alias?: string
          author_id?: string
          created_at?: string
          description?: string
          id?: number
          original_author_id?: string | null
          project?: string
          queryParams?: Json | null
          recipe_id?: number
          replay?: Json | null
          requestBody?: Json | null
          title?: string
          urlParams?: Json | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "template_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "user_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "template_original_author_id_fkey"
            columns: ["original_author_id"]
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "template_original_author_id_fkey"
            columns: ["original_author_id"]
            referencedRelation: "user_view"
            referencedColumns: ["user_id"]
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
          },
          {
            foreignKeyName: "template_recipe_id_fkey"
            columns: ["recipe_id"]
            referencedRelation: "recipe_view"
            referencedColumns: ["id"]
          }
        ]
      }
      template_fork: {
        Row: {
          created_at: string
          id: number
          new_author_id: string
          new_template: number
          original_author_id: string
          original_template: number
        }
        Insert: {
          created_at?: string
          id?: number
          new_author_id: string
          new_template: number
          original_author_id: string
          original_template: number
        }
        Update: {
          created_at?: string
          id?: number
          new_author_id?: string
          new_template?: number
          original_author_id?: string
          original_template?: number
        }
        Relationships: [
          {
            foreignKeyName: "template_fork_new_author_id_fkey"
            columns: ["new_author_id"]
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "template_fork_new_author_id_fkey"
            columns: ["new_author_id"]
            referencedRelation: "user_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "template_fork_original_author_id_fkey"
            columns: ["original_author_id"]
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "template_fork_original_author_id_fkey"
            columns: ["original_author_id"]
            referencedRelation: "user_view"
            referencedColumns: ["user_id"]
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
      recipe_view: {
        Row: {
          auth: string | null
          author: string | null
          created_at: string | null
          id: number | null
          label: string | null
          method: Database["public"]["Enums"]["recipemethod"] | null
          options: Json | null
          path: string | null
          private: boolean | null
          project: string | null
          queryParams: Json | null
          rank: number | null
          requestBody: Json | null
          summary: string | null
          tags: string[] | null
          tags_count: number | null
          templates: Json[] | null
          title: string | null
          urlParams: Json | null
        }
        Insert: {
          auth?: string | null
          author?: string | null
          created_at?: string | null
          id?: number | null
          label?: never
          method?: Database["public"]["Enums"]["recipemethod"] | null
          options?: Json | null
          path?: string | null
          private?: boolean | null
          project?: string | null
          queryParams?: Json | null
          rank?: number | null
          requestBody?: Json | null
          summary?: string | null
          tags?: string[] | null
          tags_count?: never
          templates?: Json[] | null
          title?: string | null
          urlParams?: Json | null
        }
        Update: {
          auth?: string | null
          author?: string | null
          created_at?: string | null
          id?: number | null
          label?: never
          method?: Database["public"]["Enums"]["recipemethod"] | null
          options?: Json | null
          path?: string | null
          private?: boolean | null
          project?: string | null
          queryParams?: Json | null
          rank?: number | null
          requestBody?: Json | null
          summary?: string | null
          tags?: string[] | null
          tags_count?: never
          templates?: Json[] | null
          title?: string | null
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
      template_public_view: {
        Row: {
          alias: string | null
          author_id: string | null
          created_at: string | null
          description: string | null
          id: number | null
          original_author: Json | null
          original_author_id: string | null
          project: string | null
          queryParams: Json | null
          recipe: Json | null
          recipe_id: number | null
          replay: Json | null
          requestBody: Json | null
          title: string | null
          urlParams: Json | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "template_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "user_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "template_original_author_id_fkey"
            columns: ["original_author_id"]
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "template_original_author_id_fkey"
            columns: ["original_author_id"]
            referencedRelation: "user_view"
            referencedColumns: ["user_id"]
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
          },
          {
            foreignKeyName: "template_recipe_id_fkey"
            columns: ["recipe_id"]
            referencedRelation: "recipe_view"
            referencedColumns: ["id"]
          }
        ]
      }
      user_view: {
        Row: {
          first: string | null
          last: string | null
          profile_pic: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          first?: string | null
          last?: string | null
          profile_pic?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          first?: string | null
          last?: string | null
          profile_pic?: string | null
          user_id?: string | null
          username?: string | null
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
    Functions: {
      is_limited: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      recipemethod: "GET" | "POST" | "PUT" | "DELETE"
      recipeprojectstatus: "Active" | "Install" | "Waitlist" | "Soon"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
