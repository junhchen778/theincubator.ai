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
      companies: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          founded_date: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          one_line_pitch: string | null
          sector: string[] | null
          stage: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          founded_date?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          one_line_pitch?: string | null
          sector?: string[] | null
          stage?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          founded_date?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          one_line_pitch?: string | null
          sector?: string[] | null
          stage?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      company_assignments: {
        Row: {
          assigned_by: string
          assigned_to: string | null
          company_id: string
          created_at: string | null
          firm_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          assigned_by: string
          assigned_to?: string | null
          company_id: string
          created_at?: string | null
          firm_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string
          assigned_to?: string | null
          company_id?: string
          created_at?: string | null
          firm_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_assignments_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "vc_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      company_follows: {
        Row: {
          company_id: string
          created_at: string | null
          firm_id: string | null
          follower_id: string
          id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          firm_id?: string | null
          follower_id: string
          id?: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          firm_id?: string | null
          follower_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_follows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_follows_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "vc_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      company_founders: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          title: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          title?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_founders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_founders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      company_interests: {
        Row: {
          company_id: string
          created_at: string | null
          firm_id: string | null
          id: string
          investor_id: string
          message: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          firm_id?: string | null
          id?: string
          investor_id: string
          message?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          firm_id?: string | null
          id?: string
          investor_id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_interests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_interests_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "vc_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_interests_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_activity: {
        Row: {
          action_type: string
          company_id: string
          created_at: string | null
          firm_id: string
          id: string
          member_id: string
          metadata: Json | null
        }
        Insert: {
          action_type: string
          company_id: string
          created_at?: string | null
          firm_id: string
          id?: string
          member_id: string
          metadata?: Json | null
        }
        Update: {
          action_type?: string
          company_id?: string
          created_at?: string | null
          firm_id?: string
          id?: string
          member_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "firm_activity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_activity_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "vc_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_activity_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_members: {
        Row: {
          firm_id: string
          id: string
          joined_at: string | null
          role: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          firm_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          firm_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "firm_members_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "vc_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_notes: {
        Row: {
          author_id: string
          company_id: string
          content: string
          created_at: string | null
          firm_id: string
          id: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          company_id: string
          content: string
          created_at?: string | null
          firm_id: string
          id?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          company_id?: string
          content?: string
          created_at?: string | null
          firm_id?: string
          id?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "firm_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firm_notes_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "vc_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      individual_investors: {
        Row: {
          accredited: boolean | null
          created_at: string | null
          id: string
          investment_thesis: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accredited?: boolean | null
          created_at?: string | null
          id?: string
          investment_thesis?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accredited?: boolean | null
          created_at?: string | null
          id?: string
          investment_thesis?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "individual_investors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          company_id: string | null
          content: string
          created_at: string | null
          id: string
          media_urls: string[] | null
          metadata: Json | null
          milestone_tag: string | null
          post_type: string | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          company_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          milestone_tag?: string | null
          post_type?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          company_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          milestone_tag?: string | null
          post_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          linkedin_url: string | null
          updated_at: string | null
          user_type: string
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          linkedin_url?: string | null
          updated_at?: string | null
          user_type: string
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          linkedin_url?: string | null
          updated_at?: string | null
          user_type?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      vc_firms: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          investment_thesis: Json | null
          logo_url: string | null
          name: string
          updated_at: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          investment_thesis?: Json | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          investment_thesis?: Json | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vc_firms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
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
