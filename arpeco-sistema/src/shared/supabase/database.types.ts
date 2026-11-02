export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          occurred_at: string
          reason: string | null
          request_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          occurred_at?: string
          reason?: string | null
          request_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          occurred_at?: string
          reason?: string | null
          request_id?: string | null
        }
        Relationships: []
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          industry: string | null
          legal_name: string
          merged_into_id: string | null
          name_key: string
          notes: string | null
          owner_id: string
          phone: string | null
          status: string
          tax_id: string | null
          tax_id_key: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          legal_name: string
          merged_into_id?: string | null
          name_key?: string
          notes?: string | null
          owner_id: string
          phone?: string | null
          status?: string
          tax_id?: string | null
          tax_id_key?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          legal_name?: string
          merged_into_id?: string | null
          name_key?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          status?: string
          tax_id?: string | null
          tax_id_key?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sequences: {
        Row: {
          kind: string
          next_no: number
          year: number
        }
        Insert: {
          kind: string
          next_no: number
          year: number
        }
        Update: {
          kind?: string
          next_no?: number
          year?: number
        }
        Relationships: []
      }
      fair_prospects: {
        Row: {
          client_id: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          fair_id: string
          first_seen_on: string
          id: string
          name_key: string
          notes: string | null
          owner_id: string
          phone: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          fair_id: string
          first_seen_on?: string
          id?: string
          name_key?: string
          notes?: string | null
          owner_id: string
          phone?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          fair_id?: string
          first_seen_on?: string
          id?: string
          name_key?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fair_prospects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fair_prospects_fair_id_fkey"
            columns: ["fair_id"]
            isOneToOne: false
            referencedRelation: "fairs"
            referencedColumns: ["id"]
          },
        ]
      }
      fair_staff: {
        Row: {
          fair_id: string
          user_id: string
        }
        Insert: {
          fair_id: string
          user_id: string
        }
        Update: {
          fair_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fair_staff_fair_id_fkey"
            columns: ["fair_id"]
            isOneToOne: false
            referencedRelation: "fairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fair_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fairs: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_on: string | null
          id: string
          name: string
          place: string | null
          starts_on: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_on?: string | null
          id?: string
          name: string
          place?: string | null
          starts_on: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_on?: string | null
          id?: string
          name?: string
          place?: string | null
          starts_on?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      followups: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          next_on: string | null
          occurred_at: string
          opportunity_id: string | null
          owner_id: string
          prospect_id: string | null
          status: string
          summary: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          next_on?: string | null
          occurred_at?: string
          opportunity_id?: string | null
          owner_id: string
          prospect_id?: string | null
          status?: string
          summary: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          next_on?: string | null
          occurred_at?: string
          opportunity_id?: string | null
          owner_id?: string
          prospect_id?: string | null
          status?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "followups_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "fair_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          document_path: string | null
          id: string
          idempotency_key: string
          invoice_no: string
          issued_on: string
          reason: string | null
          sale_id: string
          status: string
          voids_invoice_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          document_path?: string | null
          id?: string
          idempotency_key: string
          invoice_no: string
          issued_on: string
          reason?: string | null
          sale_id: string
          status?: string
          voids_invoice_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          document_path?: string | null
          id?: string
          idempotency_key?: string
          invoice_no?: string
          issued_on?: string
          reason?: string | null
          sale_id?: string
          status?: string
          voids_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sale_balances"
            referencedColumns: ["sale_id"]
          },
          {
            foreignKeyName: "invoices_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_voids_invoice_id_fkey"
            columns: ["voids_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          client_id: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          estimated_amount: number | null
          id: string
          next_followup_on: string | null
          origin_fair_id: string | null
          owner_id: string
          prospect_id: string | null
          stage: string
          title: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          estimated_amount?: number | null
          id?: string
          next_followup_on?: string | null
          origin_fair_id?: string | null
          owner_id: string
          prospect_id?: string | null
          stage?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          estimated_amount?: number | null
          id?: string
          next_followup_on?: string | null
          origin_fair_id?: string | null
          owner_id?: string
          prospect_id?: string | null
          stage?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_origin_fair_id_fkey"
            columns: ["origin_fair_id"]
            isOneToOne: false
            referencedRelation: "fairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "fair_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          idempotency_key: string
          method: string | null
          reason: string | null
          received_on: string
          reference: string | null
          sale_id: string
          status: string
          voids_payment_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          idempotency_key: string
          method?: string | null
          reason?: string | null
          received_on: string
          reference?: string | null
          sale_id: string
          status?: string
          voids_payment_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          idempotency_key?: string
          method?: string | null
          reason?: string | null
          received_on?: string
          reference?: string | null
          sale_id?: string
          status?: string
          voids_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sale_balances"
            referencedColumns: ["sale_id"]
          },
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_voids_payment_id_fkey"
            columns: ["voids_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          code: string
          description: string | null
          label: string
          module: string
          reserved: boolean
        }
        Insert: {
          action: string
          code: string
          description?: string | null
          label: string
          module: string
          reserved?: boolean
        }
        Update: {
          action?: string
          code?: string
          description?: string | null
          label?: string
          module?: string
          reserved?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activated_at: string | null
          active: boolean
          created_at: string
          display_name: string
          email: string
          id: string
          last_seen_at: string | null
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          active?: boolean
          created_at?: string
          display_name?: string
          email?: string
          id: string
          last_seen_at?: string | null
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          active?: boolean
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          last_seen_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_costs: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          idempotency_key: string
          incurred_on: string
          project_id: string
          reason: string | null
          status: string
          voids_cost_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          idempotency_key: string
          incurred_on: string
          project_id: string
          reason?: string | null
          status?: string
          voids_cost_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          idempotency_key?: string
          incurred_on?: string
          project_id?: string
          reason?: string | null
          status?: string
          voids_cost_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_costs_voids_cost_id_fkey"
            columns: ["voids_cost_id"]
            isOneToOne: false
            referencedRelation: "project_costs"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          commercial_no: string | null
          costs_complete_at: string | null
          costs_complete_by: string | null
          costs_reopened_at: string | null
          created_at: string
          event_on: string | null
          id: string
          manager_id: string | null
          sale_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          commercial_no?: string | null
          costs_complete_at?: string | null
          costs_complete_by?: string | null
          costs_reopened_at?: string | null
          created_at?: string
          event_on?: string | null
          id?: string
          manager_id?: string | null
          sale_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          commercial_no?: string | null
          costs_complete_at?: string | null
          costs_complete_by?: string | null
          costs_reopened_at?: string | null
          created_at?: string
          event_on?: string | null
          id?: string
          manager_id?: string | null
          sale_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: true
            referencedRelation: "sale_balances"
            referencedColumns: ["sale_id"]
          },
          {
            foreignKeyName: "projects_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: true
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          description: string
          id: string
          position: number
          quantity: number
          quote_id: string
          subtotal: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          position: number
          quantity: number
          quote_id: string
          subtotal?: number
          unit_price: number
        }
        Update: {
          description?: string
          id?: string
          position?: number
          quantity?: number
          quote_id?: string
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_revisions: {
        Row: {
          created_at: string
          id: string
          quote_id: string
          revision: number
          sha256: string
          snapshot: Json
        }
        Insert: {
          created_at?: string
          id?: string
          quote_id: string
          revision: number
          sha256: string
          snapshot: Json
        }
        Update: {
          created_at?: string
          id?: string
          quote_id?: string
          revision?: number
          sha256?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "quote_revisions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_template_items: {
        Row: {
          description: string
          id: string
          position: number
          quantity: number
          template_id: string
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          position: number
          quantity: number
          template_id: string
          unit_price: number
        }
        Update: {
          description?: string
          id?: string
          position?: number
          quantity?: number
          template_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "quote_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          acceptance_evidence: string | null
          accepted_at: string | null
          accepted_by: string | null
          client_id: string
          commercial_no: string | null
          created_at: string
          created_by: string | null
          currency: string
          estimated_cost: number | null
          event_on: string | null
          id: string
          internal_notes: string | null
          issued_on: string | null
          opportunity_id: string | null
          origin_fair_id: string | null
          owner_id: string
          public_notes: string | null
          revision: number
          sent_at: string | null
          status: string
          title: string
          total: number
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          acceptance_evidence?: string | null
          accepted_at?: string | null
          accepted_by?: string | null
          client_id: string
          commercial_no?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          estimated_cost?: number | null
          event_on?: string | null
          id?: string
          internal_notes?: string | null
          issued_on?: string | null
          opportunity_id?: string | null
          origin_fair_id?: string | null
          owner_id: string
          public_notes?: string | null
          revision?: number
          sent_at?: string | null
          status?: string
          title: string
          total?: number
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          acceptance_evidence?: string | null
          accepted_at?: string | null
          accepted_by?: string | null
          client_id?: string
          commercial_no?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          estimated_cost?: number | null
          event_on?: string | null
          id?: string
          internal_notes?: string | null
          issued_on?: string | null
          opportunity_id?: string | null
          origin_fair_id?: string | null
          owner_id?: string
          public_notes?: string | null
          revision?: number
          sent_at?: string | null
          status?: string
          title?: string
          total?: number
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_origin_fair_id_fkey"
            columns: ["origin_fair_id"]
            isOneToOne: false
            referencedRelation: "fairs"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_code: string
          role_code: string
        }
        Insert: {
          permission_code: string
          role_code: string
        }
        Update: {
          permission_code?: string
          role_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_code_fkey"
            columns: ["permission_code"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "role_permissions_role_code_fkey"
            columns: ["role_code"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["code"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          description: string | null
          is_system: boolean
          label: string
          protected: boolean
        }
        Insert: {
          code: string
          description?: string | null
          is_system?: boolean
          label: string
          protected?: boolean
        }
        Update: {
          code?: string
          description?: string | null
          is_system?: boolean
          label?: string
          protected?: boolean
        }
        Relationships: []
      }
      sales: {
        Row: {
          accepted_on: string
          amount: number
          client_id: string
          commercial_no: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          currency: string
          id: string
          origin_fair_id: string | null
          owner_id: string
          quote_id: string
          quote_revision: number
          status: string
        }
        Insert: {
          accepted_on: string
          amount: number
          client_id: string
          commercial_no?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          origin_fair_id?: string | null
          owner_id: string
          quote_id: string
          quote_revision: number
          status?: string
        }
        Update: {
          accepted_on?: string
          amount?: number
          client_id?: string
          commercial_no?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          origin_fair_id?: string | null
          owner_id?: string
          quote_id?: string
          quote_revision?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_origin_fair_id_fkey"
            columns: ["origin_fair_id"]
            isOneToOne: false
            referencedRelation: "fairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      support_access: {
        Row: {
          approved_by: string
          created_at: string
          expires_at: string
          id: string
          reason: string
          scope: string
          starts_at: string
          support_user_id: string
        }
        Insert: {
          approved_by: string
          created_at?: string
          expires_at: string
          id?: string
          reason: string
          scope?: string
          starts_at?: string
          support_user_id: string
        }
        Update: {
          approved_by?: string
          created_at?: string
          expires_at?: string
          id?: string
          reason?: string
          scope?: string
          starts_at?: string
          support_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_access_support_user_id_fkey"
            columns: ["support_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          effect: string
          granted_at: string
          granted_by: string | null
          permission_code: string
          user_id: string
        }
        Insert: {
          effect: string
          granted_at?: string
          granted_by?: string | null
          permission_code: string
          user_id: string
        }
        Update: {
          effect?: string
          granted_at?: string
          granted_by?: string | null
          permission_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_code_fkey"
            columns: ["permission_code"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role_code: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role_code: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_code_fkey"
            columns: ["role_code"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      sale_balances: {
        Row: {
          amount: number | null
          invoiced: number | null
          paid: number | null
          pending_collection: number | null
          pending_invoicing: number | null
          sale_id: string | null
        }
        Insert: {
          amount?: number | null
          invoiced?: never
          paid?: never
          pending_collection?: never
          pending_invoicing?: never
          sale_id?: string | null
        }
        Update: {
          amount?: number | null
          invoiced?: never
          paid?: never
          pending_collection?: never
          pending_invoicing?: never
          sale_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_quote: {
        Args: { p_evidence?: string; p_expected_revision: number; p_id: string }
        Returns: undefined
      }
      assign_project_manager: {
        Args: { p_manager: string; p_project: string }
        Returns: undefined
      }
      complete_costs: {
        Args: { p_project: string; p_reason?: string }
        Returns: undefined
      }
      confirm_sale: {
        Args: { p_expected_revision: number; p_id: string }
        Returns: {
          project_id: string
          sale_id: string
        }[]
      }
      create_quote_from_template: {
        Args: { p_client: string; p_template: string; p_title: string }
        Returns: string
      }
      create_role: {
        Args: { p_code: string; p_description?: string; p_label: string }
        Returns: undefined
      }
      create_template: {
        Args: { p_description?: string; p_items?: Json; p_name: string }
        Returns: string
      }
      delete_role: { Args: { p_code: string }; Returns: undefined }
      delete_template: { Args: { p_id: string }; Returns: undefined }
      duplicate_quote: {
        Args: { p_client?: string; p_source: string }
        Returns: string
      }
      effective_permissions: {
        Args: { p_user: string }
        Returns: {
          permission_code: string
          source: string
        }[]
      }
      f_unaccent: { Args: { "": string }; Returns: string }
      grant_role: {
        Args: {
          p_reason: string
          p_role: string
          p_second_approver?: string
          p_target: string
        }
        Returns: undefined
      }
      has_permission: { Args: { p_code: string }; Returns: boolean }
      has_role: { Args: { p_role: string }; Returns: boolean }
      has_support_access: { Args: never; Returns: boolean }
      is_active: { Args: never; Returns: boolean }
      is_admin_or_direction: { Args: never; Returns: boolean }
      is_direction: { Args: never; Returns: boolean }
      is_last_superadmin: { Args: { p_user: string }; Returns: boolean }
      list_assignable_users: {
        Args: never
        Returns: {
          display_name: string
          email: string
          id: string
          roles: string[]
        }[]
      }
      log_audit: {
        Args: {
          p_action: string
          p_after?: Json
          p_before?: Json
          p_entity_id: string
          p_entity_type: string
          p_reason?: string
        }
        Returns: undefined
      }
      manages_project: { Args: { p_project: string }; Returns: boolean }
      manages_sale: { Args: { p_sale: string }; Returns: boolean }
      merge_clients: {
        Args: { p_from: string; p_into: string; p_reason: string }
        Returns: undefined
      }
      my_permissions: { Args: never; Returns: string[] }
      next_document_no: { Args: { p_kind: string }; Returns: string }
      normalize_name: { Args: { p: string }; Returns: string }
      normalize_tax_id: { Args: { p: string }; Returns: string }
      owns_sale: { Args: { p_sale: string }; Returns: boolean }
      payment_details: {
        Args: { p_sale: string }
        Returns: {
          amount: number
          id: string
          method: string
          received_on: string
          reference: string
          status: string
        }[]
      }
      project_margin: {
        Args: { p_project: string }
        Returns: {
          costs_complete: boolean
          estimated_cost: number
          margin_estimated_pct: number
          margin_recorded_pct: number
          recorded_cost: number
          sale_amount: number
        }[]
      }
      quote_margin: {
        Args: { p_id: string }
        Returns: {
          estimated_cost: number
          internal_notes: string
          margin_pct: number
        }[]
      }
      reassign_owner: {
        Args: {
          p_entity: string
          p_id: string
          p_new_owner: string
          p_reason: string
        }
        Returns: undefined
      }
      register_cost: {
        Args: {
          p_amount: number
          p_category?: string
          p_description: string
          p_idempotency: string
          p_incurred: string
          p_project: string
        }
        Returns: string
      }
      register_invoice: {
        Args: {
          p_amount: number
          p_document_path?: string
          p_idempotency: string
          p_invoice_no: string
          p_issued: string
          p_sale: string
        }
        Returns: string
      }
      register_payment: {
        Args: {
          p_amount: number
          p_idempotency: string
          p_method: string
          p_received: string
          p_reference: string
          p_sale: string
        }
        Returns: string
      }
      reject_quote: {
        Args: { p_id: string; p_reason: string }
        Returns: undefined
      }
      report_business: {
        Args: { p_from: string; p_to: string }
        Returns: {
          accepted: number
          collected: number
          invoiced: number
          pending_collection: number
          quoted: number
          sales_count: number
          sold: number
        }[]
      }
      report_fairs: {
        Args: { p_from: string; p_to: string }
        Returns: {
          buyers: number
          conversion_pct: number
          fair_id: string
          name: string
          prospects: number
        }[]
      }
      report_profitability: {
        Args: { p_from: string; p_to: string }
        Returns: {
          cost_complete: number
          gain: number
          jobs_complete: number
          jobs_pending: number
          jobs_total: number
          margin_pct: number
          sold_total: number
        }[]
      }
      report_sellers: {
        Args: { p_from: string; p_to: string }
        Returns: {
          conversion_pct: number
          display_name: string
          opps_created: number
          owner_id: string
          quotes_sent: number
          sales_count: number
          sold: number
        }[]
      }
      revise_quote: { Args: { p_id: string }; Returns: undefined }
      revoke_role: {
        Args: { p_reason: string; p_role: string; p_target: string }
        Returns: undefined
      }
      save_quote_as_template: {
        Args: { p_description?: string; p_name: string; p_quote: string }
        Returns: string
      }
      search_clients_min: {
        Args: { p_query: string }
        Returns: {
          id: string
          legal_name: string
          owner_id: string
          status: string
          tax_id: string
        }[]
      }
      send_quote: { Args: { p_id: string }; Returns: undefined }
      set_app_setting: {
        Args: { p_key: string; p_value: Json }
        Returns: undefined
      }
      set_quote_internal: {
        Args: { p_cost?: number; p_id: string; p_notes?: string }
        Returns: undefined
      }
      set_role_permissions: {
        Args: { p_code: string; p_perms: string[] }
        Returns: undefined
      }
      set_user_active: {
        Args: { p_active: boolean; p_reason: string; p_target: string }
        Returns: undefined
      }
      set_user_permission: {
        Args: { p_effect?: string; p_perm: string; p_user: string }
        Returns: undefined
      }
      update_role: {
        Args: { p_code: string; p_description?: string; p_label: string }
        Returns: undefined
      }
      update_template: {
        Args: {
          p_description?: string
          p_id: string
          p_items?: Json
          p_name: string
        }
        Returns: undefined
      }
      void_cost: {
        Args: { p_id: string; p_reason: string }
        Returns: undefined
      }
      void_invoice: {
        Args: { p_id: string; p_reason: string }
        Returns: undefined
      }
      void_payment: {
        Args: { p_id: string; p_reason: string }
        Returns: undefined
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

