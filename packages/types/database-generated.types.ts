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
          owner_id: string | null
          project: string
          scope: Database["public"]["Enums"]["projectscope"]
          status: Database["public"]["Enums"]["recipeprojectstatus"]
          subheader: string
          tags: string[] | null
          title: string
          visibility: Database["public"]["Enums"]["projectvisibility"]
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: number
          image?: string | null
          owner_id?: string | null
          project: string
          scope?: Database["public"]["Enums"]["projectscope"]
          status: Database["public"]["Enums"]["recipeprojectstatus"]
          subheader: string
          tags?: string[] | null
          title: string
          visibility?: Database["public"]["Enums"]["projectvisibility"]
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: number
          image?: string | null
          owner_id?: string | null
          project?: string
          scope?: Database["public"]["Enums"]["projectscope"]
          status?: Database["public"]["Enums"]["recipeprojectstatus"]
          subheader?: string
          tags?: string[] | null
          title?: string
          visibility?: Database["public"]["Enums"]["projectvisibility"]
        }
        Relationships: [
          {
            foreignKeyName: "project_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "user_view"
            referencedColumns: ["user_id"]
          }
        ]
      }
      project_member: {
        Row: {
          created_at: string
          id: number
          project_id: number
          role: Database["public"]["Enums"]["projectmemberrole"]
        }
        Insert: {
          created_at?: string
          id?: number
          project_id: number
          role?: Database["public"]["Enums"]["projectmemberrole"]
        }
        Update: {
          created_at?: string
          id?: number
          project_id?: number
          role?: Database["public"]["Enums"]["projectmemberrole"]
        }
        Relationships: [
          {
            foreignKeyName: "project_member_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_member_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "global_projects_view"
            referencedColumns: ["id"]
          }
        ]
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
          },
          {
            foreignKeyName: "recipe_project_fkey"
            columns: ["project"]
            referencedRelation: "global_projects_view"
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
            foreignKeyName: "template_project_fkey"
            columns: ["project"]
            referencedRelation: "global_projects_view"
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
      global_projects_view: {
        Row: {
          created_at: string | null
          description: string | null
          id: number | null
          image: string | null
          owner_id: string | null
          project: string | null
          scope: Database["public"]["Enums"]["projectscope"] | null
          status: Database["public"]["Enums"]["recipeprojectstatus"] | null
          subheader: string | null
          tags: string[] | null
          title: string | null
          visibility: Database["public"]["Enums"]["projectvisibility"] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number | null
          image?: string | null
          owner_id?: string | null
          project?: string | null
          scope?: Database["public"]["Enums"]["projectscope"] | null
          status?: Database["public"]["Enums"]["recipeprojectstatus"] | null
          subheader?: string | null
          tags?: string[] | null
          title?: string | null
          visibility?: Database["public"]["Enums"]["projectvisibility"] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number | null
          image?: string | null
          owner_id?: string | null
          project?: string | null
          scope?: Database["public"]["Enums"]["projectscope"] | null
          status?: Database["public"]["Enums"]["recipeprojectstatus"] | null
          subheader?: string | null
          tags?: string[] | null
          title?: string | null
          visibility?: Database["public"]["Enums"]["projectvisibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "project_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "project_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "user_view"
            referencedColumns: ["user_id"]
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
            foreignKeyName: "template_project_fkey"
            columns: ["project"]
            referencedRelation: "global_projects_view"
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
      projectmemberrole: "owner" | "editor" | "viewer"
      projectscope: "personal" | "team" | "global"
      projectvisibility: "private" | "public" | "unlisted"
      recipemethod: "GET" | "POST" | "PUT" | "DELETE"
      recipeprojectstatus: "Active" | "Install" | "Waitlist" | "Soon"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
