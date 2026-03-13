export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      assets: {
        Row: {
          created_at: string;
          file_name: string;
          id: string;
          issue_id: string | null;
          kind: string;
          mime_type: string | null;
          owner_id: string;
          project_id: string;
          size_bytes: number | null;
          storage_path: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          file_name: string;
          id?: string;
          issue_id?: string | null;
          kind: string;
          mime_type?: string | null;
          owner_id: string;
          project_id: string;
          size_bytes?: number | null;
          storage_path: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          id?: string;
          issue_id?: string | null;
          kind?: string;
          mime_type?: string | null;
          owner_id?: string;
          project_id?: string;
          size_bytes?: number | null;
          storage_path?: string;
          updated_at?: string;
        };
      };
      brands: {
        Row: {
          accent_color: string | null;
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          primary_color: string | null;
          slug: string;
          typography_scale: Json;
          updated_at: string;
        };
        Insert: {
          accent_color?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          owner_id: string;
          primary_color?: string | null;
          slug: string;
          typography_scale?: Json;
          updated_at?: string;
        };
        Update: {
          accent_color?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          primary_color?: string | null;
          slug?: string;
          typography_scale?: Json;
          updated_at?: string;
        };
      };
      contents: {
        Row: {
          analysis_error: string | null;
          analysis_model: string | null;
          analysis_provider: string | null;
          analysis_status: string;
          analyzed_at: string | null;
          body: Json;
          content_type: string;
          created_at: string;
          id: string;
          ingestion_source: string;
          issue_id: string | null;
          owner_id: string;
          priority: number;
          project_id: string;
          raw_text: string | null;
          status: string;
          source_asset_id: string | null;
          structured_content: Json | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          analysis_error?: string | null;
          analysis_model?: string | null;
          analysis_provider?: string | null;
          analysis_status?: string;
          analyzed_at?: string | null;
          body?: Json;
          content_type: string;
          created_at?: string;
          id?: string;
          ingestion_source?: string;
          issue_id?: string | null;
          owner_id: string;
          priority?: number;
          project_id: string;
          raw_text?: string | null;
          status?: string;
          source_asset_id?: string | null;
          structured_content?: Json | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          analysis_error?: string | null;
          analysis_model?: string | null;
          analysis_provider?: string | null;
          analysis_status?: string;
          analyzed_at?: string | null;
          body?: Json;
          content_type?: string;
          created_at?: string;
          id?: string;
          ingestion_source?: string;
          issue_id?: string | null;
          owner_id?: string;
          priority?: number;
          project_id?: string;
          raw_text?: string | null;
          status?: string;
          source_asset_id?: string | null;
          structured_content?: Json | null;
          title?: string;
          updated_at?: string;
        };
      };
      issues: {
        Row: {
          created_at: string;
          id: string;
          issue_number: number;
          owner_id: string;
          project_id: string;
          publish_at: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          issue_number: number;
          owner_id: string;
          project_id: string;
          publish_at?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          issue_number?: number;
          owner_id?: string;
          project_id?: string;
          publish_at?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
      };
      pages: {
        Row: {
          content_snapshot: Json;
          created_at: string;
          id: string;
          issue_id: string;
          layout_json: Json | null;
          locked: boolean;
          owner_id: string;
          page_number: number;
          page_role: string;
          project_id: string;
          status: string;
          template_id: string | null;
          updated_at: string;
        };
        Insert: {
          content_snapshot?: Json;
          created_at?: string;
          id?: string;
          issue_id: string;
          layout_json?: Json | null;
          locked?: boolean;
          owner_id: string;
          page_number: number;
          page_role?: string;
          project_id: string;
          status?: string;
          template_id?: string | null;
          updated_at?: string;
        };
        Update: {
          content_snapshot?: Json;
          created_at?: string;
          id?: string;
          issue_id?: string;
          layout_json?: Json | null;
          locked?: boolean;
          owner_id?: string;
          page_number?: number;
          page_role?: string;
          project_id?: string;
          status?: string;
          template_id?: string | null;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          project_id: string;
          role: string;
          updated_at: string;
          user_email: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          project_id: string;
          role?: string;
          updated_at?: string;
          user_email: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          project_id?: string;
          role?: string;
          updated_at?: string;
          user_email?: string;
          user_id?: string;
        };
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          brand_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          owner_id: string;
          slug: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          brand_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          owner_id: string;
          slug: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          brand_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          slug?: string;
          status?: string;
          updated_at?: string;
        };
      };
      templates: {
        Row: {
          brand_id: string | null;
          category: string | null;
          created_at: string;
          id: string;
          layout_spec: Json;
          name: string;
          owner_id: string;
          preview_url: string | null;
          scope: string;
          updated_at: string;
        };
        Insert: {
          brand_id?: string | null;
          category?: string | null;
          created_at?: string;
          id?: string;
          layout_spec?: Json;
          name: string;
          owner_id: string;
          preview_url?: string | null;
          scope?: string;
          updated_at?: string;
        };
        Update: {
          brand_id?: string | null;
          category?: string | null;
          created_at?: string;
          id?: string;
          layout_spec?: Json;
          name?: string;
          owner_id?: string;
          preview_url?: string | null;
          scope?: string;
          updated_at?: string;
        };
      };
    };
  };
}
