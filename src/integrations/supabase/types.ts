export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_details: Json | null
          action_type: string
          admin_id: string
          created_at: string
          id: string
          ip_address: unknown | null
          target_resource_id: string | null
          target_resource_type: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          target_resource_id?: string | null
          target_resource_type?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          target_resource_id?: string | null
          target_resource_type?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      agent_assignments: {
        Row: {
          agent_id: string | null
          assigned_at: string | null
          completed_at: string | null
          id: string
          notes: string | null
          patient_id: string | null
          status: string | null
        }
        Insert: {
          agent_id?: string | null
          assigned_at?: string | null
          completed_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          status?: string | null
        }
        Update: {
          agent_id?: string | null
          assigned_at?: string | null
          completed_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      agent_assisted_patients: {
        Row: {
          agent_id: string
          appointment_booking_count: number | null
          assistance_type: string
          created_at: string | null
          description: string | null
          id: string
          last_interaction_at: string | null
          notes: string | null
          patient_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          appointment_booking_count?: number | null
          assistance_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          last_interaction_at?: string | null
          notes?: string | null
          patient_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          appointment_booking_count?: number | null
          assistance_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          last_interaction_at?: string | null
          notes?: string | null
          patient_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ambulance_requests: {
        Row: {
          ambulance_eta: number | null
          assigned_hospital_id: string | null
          contact_phone: string
          created_at: string | null
          description: string | null
          destination_address: string | null
          destination_latitude: number | null
          destination_longitude: number | null
          emergency_type: string
          id: string
          patient_id: string
          pickup_address: string
          pickup_latitude: number | null
          pickup_longitude: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ambulance_eta?: number | null
          assigned_hospital_id?: string | null
          contact_phone: string
          created_at?: string | null
          description?: string | null
          destination_address?: string | null
          destination_latitude?: number | null
          destination_longitude?: number | null
          emergency_type: string
          id?: string
          patient_id: string
          pickup_address: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ambulance_eta?: number | null
          assigned_hospital_id?: string | null
          contact_phone?: string
          created_at?: string | null
          description?: string | null
          destination_address?: string | null
          destination_latitude?: number | null
          destination_longitude?: number | null
          emergency_type?: string
          id?: string
          patient_id?: string
          pickup_address?: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambulance_requests_assigned_hospital_id_fkey"
            columns: ["assigned_hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_data: {
        Row: {
          created_at: string | null
          hospital_id: string | null
          id: string
          metric_date: string | null
          metric_name: string
          metric_value: number | null
        }
        Insert: {
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          metric_date?: string | null
          metric_name: string
          metric_value?: number | null
        }
        Update: {
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          metric_date?: string | null
          metric_name?: string
          metric_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_data_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          agent_id: string | null
          appointment_date: string
          appointment_time: string
          appointment_type: string | null
          consultation_type: string
          created_at: string | null
          hospital_id: string | null
          id: string
          meeting_link: string | null
          notes: string | null
          patient_id: string
          physician_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          appointment_date: string
          appointment_time: string
          appointment_type?: string | null
          consultation_type?: string
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          patient_id: string
          physician_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string | null
          consultation_type?: string
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          patient_id?: string
          physician_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_alerts: {
        Row: {
          alert_type: string
          compliance_score: number | null
          compliance_type: string
          created_at: string
          due_date: string | null
          hospital_id: string
          id: string
          is_resolved: boolean | null
          message: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          compliance_score?: number | null
          compliance_type: string
          created_at?: string
          due_date?: string | null
          hospital_id: string
          id?: string
          is_resolved?: boolean | null
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
        }
        Update: {
          alert_type?: string
          compliance_score?: number | null
          compliance_type?: string
          created_at?: string
          due_date?: string | null
          hospital_id?: string
          id?: string
          is_resolved?: boolean | null
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_compliance_alerts_hospital"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_reports: {
        Row: {
          created_at: string
          date_range_end: string | null
          date_range_start: string | null
          file_url: string | null
          generated_by: string
          id: string
          report_data: Json
          report_type: string
          status: string | null
        }
        Insert: {
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          file_url?: string | null
          generated_by: string
          id?: string
          report_data?: Json
          report_type: string
          status?: string | null
        }
        Update: {
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          file_url?: string | null
          generated_by?: string
          id?: string
          report_data?: Json
          report_type?: string
          status?: string | null
        }
        Relationships: []
      }
      consultation_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          sender_type: string
          session_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          sender_type: string
          session_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_type?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "consultation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_rooms: {
        Row: {
          created_at: string
          id: string
          patient_joined: boolean
          physician_joined: boolean
          room_status: string
          room_token: string
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_joined?: boolean
          physician_joined?: boolean
          room_status?: string
          room_token: string
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_joined?: boolean
          physician_joined?: boolean
          room_status?: string
          room_token?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_rooms_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "consultation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_sessions: {
        Row: {
          appointment_id: string | null
          consultation_rate: number
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          id: string
          patient_id: string
          payment_status: string
          physician_id: string
          session_type: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          consultation_rate?: number
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          patient_id: string
          payment_status?: string
          physician_id: string
          session_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          consultation_rate?: number
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          patient_id?: string
          payment_status?: string
          physician_id?: string
          session_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          patient_id: string
          physician_id: string | null
          status: string | null
          title: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          patient_id: string
          physician_id?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          patient_id?: string
          physician_id?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          document_name: string
          document_type: string
          document_url: string
          id: string
          upload_date: string | null
          user_id: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          document_name: string
          document_type: string
          document_url: string
          id?: string
          upload_date?: string | null
          user_id?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          document_name?: string
          document_type?: string
          document_url?: string
          id?: string
          upload_date?: string | null
          user_id?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          patient_id: string
          phone: string
          relationship: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          patient_id: string
          phone: string
          relationship: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          patient_id?: string
          phone?: string
          relationship?: string
          updated_at?: string
        }
        Relationships: []
      }
      emergency_requests: {
        Row: {
          assigned_physician_id: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          emergency_type: string
          hospital_id: string | null
          id: string
          location_latitude: number | null
          location_longitude: number | null
          patient_id: string | null
          severity: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_physician_id?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          emergency_type: string
          hospital_id?: string | null
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          patient_id?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_physician_id?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          emergency_type?: string
          hospital_id?: string | null
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          patient_id?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_requests_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      enhanced_audit_logs: {
        Row: {
          action_category: string
          action_type: string
          compliance_relevant: boolean | null
          created_at: string
          financial_impact: number | null
          hospital_id: string | null
          id: string
          impact_level: string | null
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_category: string
          action_type: string
          compliance_relevant?: boolean | null
          created_at?: string
          financial_impact?: number | null
          hospital_id?: string | null
          id?: string
          impact_level?: string | null
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_category?: string
          action_type?: string
          compliance_relevant?: boolean | null
          created_at?: string
          financial_impact?: number | null
          hospital_id?: string | null
          id?: string
          impact_level?: string | null
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_enhanced_audit_logs_hospital"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_alerts: {
        Row: {
          alert_type: string
          created_at: string
          current_value: number | null
          hospital_id: string
          id: string
          is_resolved: boolean | null
          message: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          threshold_value: number | null
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          current_value?: number | null
          hospital_id: string
          id?: string
          is_resolved?: boolean | null
          message: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          threshold_value?: number | null
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          current_value?: number | null
          hospital_id?: string
          id?: string
          is_resolved?: boolean | null
          message?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          threshold_value?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_financial_alerts_hospital"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_disputes: {
        Row: {
          amount: number | null
          created_at: string
          description: string
          dispute_type: string
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description: string
          dispute_type: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string
          dispute_type?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      health_records: {
        Row: {
          created_at: string
          description: string | null
          document_url: string | null
          id: string
          is_sensitive: boolean | null
          patient_id: string
          record_data: Json | null
          record_type: string
          recorded_by: string | null
          recorded_date: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_url?: string | null
          id?: string
          is_sensitive?: boolean | null
          patient_id: string
          record_data?: Json | null
          record_type: string
          recorded_by?: string | null
          recorded_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_url?: string | null
          id?: string
          is_sensitive?: boolean | null
          patient_id?: string
          record_data?: Json | null
          record_type?: string
          recorded_by?: string | null
          recorded_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      healthcare_providers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          type: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          type?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          type?: string
        }
        Relationships: []
      }
      hospital_compliance_tracking: {
        Row: {
          assessed_by: string | null
          assessment_details: Json | null
          compliance_type: string
          corrective_actions: Json | null
          created_at: string
          hospital_id: string
          id: string
          last_assessment_date: string
          next_assessment_due: string | null
          score: number | null
          status: string
          updated_at: string
          violations: Json | null
        }
        Insert: {
          assessed_by?: string | null
          assessment_details?: Json | null
          compliance_type: string
          corrective_actions?: Json | null
          created_at?: string
          hospital_id: string
          id?: string
          last_assessment_date?: string
          next_assessment_due?: string | null
          score?: number | null
          status?: string
          updated_at?: string
          violations?: Json | null
        }
        Update: {
          assessed_by?: string | null
          assessment_details?: Json | null
          compliance_type?: string
          corrective_actions?: Json | null
          created_at?: string
          hospital_id?: string
          id?: string
          last_assessment_date?: string
          next_assessment_due?: string | null
          score?: number | null
          status?: string
          updated_at?: string
          violations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_hospital_compliance_hospital"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_financial_data: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string
          description: string | null
          fiscal_month: string
          hospital_id: string
          id: string
          metadata: Json | null
          reference_id: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          fiscal_month?: string
          hospital_id: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          fiscal_month?: string
          hospital_id?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_hospital_financial_data_hospital"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_patients: {
        Row: {
          admission_date: string
          assigned_physician_id: string | null
          created_at: string
          discharge_date: string | null
          hospital_id: string
          id: string
          notes: string | null
          patient_id: string
          room_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admission_date?: string
          assigned_physician_id?: string | null
          created_at?: string
          discharge_date?: string | null
          hospital_id: string
          id?: string
          notes?: string | null
          patient_id: string
          room_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admission_date?: string
          assigned_physician_id?: string | null
          created_at?: string
          discharge_date?: string | null
          hospital_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          room_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_patients_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_resources: {
        Row: {
          available_quantity: number
          category: string
          created_at: string
          hospital_id: string
          id: string
          in_use_quantity: number
          maintenance_quantity: number
          name: string
          status: string
          total_quantity: number
          updated_at: string
        }
        Insert: {
          available_quantity?: number
          category: string
          created_at?: string
          hospital_id: string
          id?: string
          in_use_quantity?: number
          maintenance_quantity?: number
          name: string
          status?: string
          total_quantity?: number
          updated_at?: string
        }
        Update: {
          available_quantity?: number
          category?: string
          created_at?: string
          hospital_id?: string
          id?: string
          in_use_quantity?: number
          maintenance_quantity?: number
          name?: string
          status?: string
          total_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_resources_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          security_settings: Json | null
          state: string | null
          verification_documents: Json | null
          verification_status: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          security_settings?: Json | null
          state?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          security_settings?: Json | null
          state?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
        }
        Relationships: []
      }
      medical_history_documents: {
        Row: {
          access_level: string | null
          document_category: string
          document_name: string
          document_type: string
          document_url: string
          id: string
          is_sensitive: boolean | null
          metadata: Json | null
          patient_id: string
          upload_date: string | null
        }
        Insert: {
          access_level?: string | null
          document_category: string
          document_name: string
          document_type: string
          document_url: string
          id?: string
          is_sensitive?: boolean | null
          metadata?: Json | null
          patient_id: string
          upload_date?: string | null
        }
        Update: {
          access_level?: string | null
          document_category?: string
          document_name?: string
          document_type?: string
          document_url?: string
          id?: string
          is_sensitive?: boolean | null
          metadata?: Json | null
          patient_id?: string
          upload_date?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      patient_data_access: {
        Row: {
          access_type: string
          accessor_id: string
          expires_at: string | null
          granted_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          patient_id: string
          purpose: string
        }
        Insert: {
          access_type: string
          accessor_id: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          patient_id: string
          purpose: string
        }
        Update: {
          access_type?: string
          accessor_id?: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          patient_id?: string
          purpose?: string
        }
        Relationships: []
      }
      patient_profiles: {
        Row: {
          created_at: string | null
          emergency_contact: Json | null
          health_challenges: string[] | null
          hobbies: string[] | null
          id: string
          medical_history: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          emergency_contact?: Json | null
          health_challenges?: string[] | null
          hobbies?: string[] | null
          id?: string
          medical_history?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          emergency_contact?: Json | null
          health_challenges?: string[] | null
          hobbies?: string[] | null
          id?: string
          medical_history?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      patient_waitlist: {
        Row: {
          called_at: string | null
          completed_at: string | null
          created_at: string
          department: string
          estimated_wait_time: number | null
          hospital_id: string
          id: string
          patient_id: string
          priority: string
          reason: string
          status: string
          updated_at: string
        }
        Insert: {
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          department: string
          estimated_wait_time?: number | null
          hospital_id: string
          id?: string
          patient_id: string
          priority?: string
          reason: string
          status?: string
          updated_at?: string
        }
        Update: {
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          department?: string
          estimated_wait_time?: number | null
          hospital_id?: string
          id?: string
          patient_id?: string
          priority?: string
          reason?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_patient_waitlist_hospital"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          id: string
          metric_type: string
          metric_value: number | null
          recorded_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          metric_type: string
          metric_value?: number | null
          recorded_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          metric_type?: string
          metric_value?: number | null
          recorded_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      physician_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          physician_id: string
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          physician_id: string
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          physician_id?: string
          start_time?: string
        }
        Relationships: []
      }
      physician_documents: {
        Row: {
          document_name: string
          document_type: string
          document_url: string
          id: string
          physician_id: string
          uploaded_at: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          document_name: string
          document_type: string
          document_url: string
          id?: string
          physician_id: string
          uploaded_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          document_name?: string
          document_type?: string
          document_url?: string
          id?: string
          physician_id?: string
          uploaded_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      physician_patients: {
        Row: {
          assigned_at: string | null
          id: string
          patient_id: string | null
          physician_id: string | null
          status: string | null
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          patient_id?: string | null
          physician_id?: string | null
          status?: string | null
        }
        Update: {
          assigned_at?: string | null
          id?: string
          patient_id?: string | null
          physician_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      physicians: {
        Row: {
          created_at: string | null
          first_name: string
          id: string
          last_name: string
          specialization: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          first_name: string
          id?: string
          last_name: string
          specialization?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string
          id?: string
          last_name?: string
          specialization?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          appointment_id: string | null
          created_at: string
          dispensed_at: string | null
          id: string
          max_repeats: number | null
          patient_id: string
          pharmacy_id: string | null
          physician_id: string
          prescription_data: Json
          repeat_allowed: boolean | null
          repeat_count: number | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          dispensed_at?: string | null
          id?: string
          max_repeats?: number | null
          patient_id: string
          pharmacy_id?: string | null
          physician_id: string
          prescription_data?: Json
          repeat_allowed?: boolean | null
          repeat_count?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          dispensed_at?: string | null
          id?: string
          max_repeats?: number | null
          patient_id?: string
          pharmacy_id?: string | null
          physician_id?: string
          prescription_data?: Json
          repeat_allowed?: boolean | null
          repeat_count?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          current_consultation_rate: number | null
          email: string
          first_name: string | null
          hospital_id: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          license_number: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          specialization: string | null
          state: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          current_consultation_rate?: number | null
          email: string
          first_name?: string | null
          hospital_id?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          license_number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialization?: string | null
          state?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          current_consultation_rate?: number | null
          email?: string
          first_name?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          license_number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialization?: string | null
          state?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_attendance: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          id: string
          notes: string | null
          schedule_id: string
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          schedule_id: string
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          schedule_id?: string
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_staff_attendance_schedule"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "staff_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_schedules: {
        Row: {
          created_at: string
          created_by: string
          department: string
          end_date: string
          end_time: string
          hospital_id: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          recurrence_pattern: string | null
          shift_type: string
          staff_id: string
          start_date: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          department: string
          end_date: string
          end_time: string
          hospital_id: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          recurrence_pattern?: string | null
          shift_type: string
          staff_id: string
          start_date: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          department?: string
          end_date?: string
          end_time?: string
          hospital_id?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          recurrence_pattern?: string | null
          shift_type?: string
          staff_id?: string
          start_date?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_staff_schedules_hospital"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string
          next_payment_date: string | null
          paystack_subscription_code: string | null
          plan_name: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          next_payment_date?: string | null
          paystack_subscription_code?: string | null
          plan_name: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          next_payment_date?: string | null
          paystack_subscription_code?: string | null
          plan_name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      symptom_assessments: {
        Row: {
          assessment_data: Json | null
          created_at: string
          id: string
          patient_id: string
          recommendations: string | null
          risk_level: string | null
          symptoms: Json
        }
        Insert: {
          assessment_data?: Json | null
          created_at?: string
          id?: string
          patient_id: string
          recommendations?: string | null
          risk_level?: string | null
          symptoms?: Json
        }
        Update: {
          assessment_data?: Json | null
          created_at?: string
          id?: string
          patient_id?: string
          recommendations?: string | null
          risk_level?: string | null
          symptoms?: Json
        }
        Relationships: []
      }
      symptom_rules: {
        Row: {
          advice: string
          created_at: string
          id: string
          is_active: boolean
          keywords: string[]
          recommended_action: string
          severity: string
          specialist_required: string | null
          symptom_name: string
          updated_at: string
        }
        Insert: {
          advice?: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          recommended_action?: string
          severity?: string
          specialist_required?: string | null
          symptom_name: string
          updated_at?: string
        }
        Update: {
          advice?: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          recommended_action?: string
          severity?: string
          specialist_required?: string | null
          symptom_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          alert_type: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          severity: string | null
          target_audience: string | null
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          severity?: string | null
          target_audience?: string | null
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          severity?: string | null
          target_audience?: string | null
          title?: string
        }
        Relationships: []
      }
      system_audit_logs: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      transport_requests: {
        Row: {
          agent_id: string | null
          appointment_id: string | null
          created_at: string | null
          destination_address: string
          destination_latitude: number | null
          destination_longitude: number | null
          driver_info: Json | null
          id: string
          patient_id: string
          pickup_address: string
          pickup_latitude: number | null
          pickup_longitude: number | null
          scheduled_time: string
          status: string | null
          transport_type: string
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          appointment_id?: string | null
          created_at?: string | null
          destination_address: string
          destination_latitude?: number | null
          destination_longitude?: number | null
          driver_info?: Json | null
          id?: string
          patient_id: string
          pickup_address: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          scheduled_time: string
          status?: string | null
          transport_type: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          appointment_id?: string | null
          created_at?: string | null
          destination_address?: string
          destination_latitude?: number | null
          destination_longitude?: number | null
          driver_info?: Json | null
          id?: string
          patient_id?: string
          pickup_address?: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          scheduled_time?: string
          status?: string | null
          transport_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_requests_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          activity_details: Json | null
          activity_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_details?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_details?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          biometric_login_enabled: boolean | null
          created_at: string
          font_size: string | null
          high_contrast: boolean | null
          id: string
          language: string | null
          notification_preferences: Json | null
          text_to_speech: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          biometric_login_enabled?: boolean | null
          created_at?: string
          font_size?: string | null
          high_contrast?: boolean | null
          id?: string
          language?: string | null
          notification_preferences?: Json | null
          text_to_speech?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          biometric_login_enabled?: boolean | null
          created_at?: string
          font_size?: string | null
          high_contrast?: boolean | null
          id?: string
          language?: string | null
          notification_preferences?: Json | null
          text_to_speech?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          auto_approved: boolean | null
          document_urls: Json | null
          id: string
          notes: string | null
          priority: number | null
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_at: string | null
          user_id: string | null
          verification_type: string | null
        }
        Insert: {
          auto_approved?: boolean | null
          document_urls?: Json | null
          id?: string
          notes?: string | null
          priority?: number | null
          request_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string | null
          verification_type?: string | null
        }
        Update: {
          auto_approved?: boolean | null
          document_urls?: Json | null
          id?: string
          notes?: string | null
          priority?: number | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string | null
          verification_type?: string | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          paystack_reference: string | null
          reference_id: string | null
          status: string | null
          transaction_type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          paystack_reference?: string | null
          reference_id?: string | null
          status?: string | null
          transaction_type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          paystack_reference?: string | null
          reference_id?: string | null
          status?: string | null
          transaction_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string | null
          currency: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          currency?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          currency?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount: number
          bank_details: Json
          created_at: string | null
          id: string
          processed_at: string | null
          status: string
          wallet_id: string
        }
        Insert: {
          amount: number
          bank_details: Json
          created_at?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          wallet_id: string
        }
        Update: {
          amount?: number
          bank_details?: Json
          created_at?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_hospital_compliance_score: {
        Args: { hospital_uuid: string }
        Returns: number
      }
      check_inperson_booking_limit: {
        Args: { patient_uuid: string }
        Returns: {
          current_count: number
          limit_allowed: number
          subscription_plan: string
          can_book_free: boolean
          extra_cost: number
        }[]
      }
      check_monthly_booking_limit: {
        Args: { patient_uuid: string }
        Returns: number
      }
      create_user_wallet: {
        Args: { user_uuid: string }
        Returns: string
      }
      create_virtual_consultation_session: {
        Args: {
          appointment_uuid: string
          patient_uuid: string
          physician_uuid: string
          consultation_rate_param?: number
        }
        Returns: string
      }
      credit_wallet: {
        Args: {
          wallet_id_param: string
          amount_param: number
          description_param: string
          reference_param?: string
        }
        Returns: Json
      }
      debit_wallet: {
        Args: {
          wallet_id_param: string
          amount_param: number
          description_param: string
          reference_param?: string
        }
        Returns: Json
      }
      end_consultation_session_secure: {
        Args: { session_uuid: string; user_uuid: string }
        Returns: boolean
      }
      generate_hospital_analytics: {
        Args: { hospital_uuid: string }
        Returns: undefined
      }
      get_admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_available_physicians: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          first_name: string
          last_name: string
          specialization: string
          hospital_name: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_nearby_physicians: {
        Args: {
          patient_lat: number
          patient_lng: number
          search_radius_km?: number
          specialty_filter?: string
        }
        Returns: {
          physician_id: string
          first_name: string
          last_name: string
          specialization: string
          hospital_name: string
          distance_km: number
        }[]
      }
      get_physician_dashboard_stats: {
        Args: { physician_uuid: string }
        Returns: Json
      }
      get_physician_patients: {
        Args: { physician_uuid: string }
        Returns: {
          patient_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          total_appointments: number
          last_appointment_date: string
        }[]
      }
      get_physicians_by_hospital: {
        Args: { hospital_uuid: string }
        Returns: {
          physician_id: string
          first_name: string
          last_name: string
          specialization: string
          consultation_rate: number
          is_available: boolean
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never> | { user_id: number }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_hospital_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      jwt_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      log_admin_action: {
        Args:
          | {
              action_type_param: string
              target_user_id_param?: string
              target_resource_type_param?: string
              target_resource_id_param?: string
              action_details_param?: Json
            }
          | {
              action_type_param: string
              target_user_id_param?: string
              target_resource_type_param?: string
              target_resource_id_param?: string
              action_details_param?: Json
            }
        Returns: string
      }
      log_enhanced_audit: {
        Args: {
          user_id_param: string
          hospital_id_param?: string
          action_category_param?: string
          action_type_param?: string
          resource_type_param?: string
          resource_id_param?: string
          old_values_param?: Json
          new_values_param?: Json
          impact_level_param?: string
          compliance_relevant_param?: boolean
          financial_impact_param?: number
        }
        Returns: string
      }
      log_patient_data_access: {
        Args: {
          patient_uuid: string
          accessor_uuid: string
          access_type_param: string
          purpose_param: string
          expires_hours?: number
        }
        Returns: string
      }
      log_user_activity: {
        Args: {
          user_id_param: string
          activity_type_param: string
          activity_details_param?: Json
        }
        Returns: string
      }
      process_consultation_payment: {
        Args: {
          session_uuid: string
          patient_uuid: string
          physician_uuid: string
          amount: number
        }
        Returns: boolean
      }
      start_consultation_session_secure: {
        Args: { session_uuid: string; user_uuid: string }
        Returns: boolean
      }
      transfer_funds: {
        Args: {
          from_wallet_id: string
          to_wallet_id: string
          amount_param: number
          description_param: string
        }
        Returns: Json
      }
    }
    Enums: {
      appointment_status: "pending" | "confirmed" | "cancelled" | "completed"
      conversation_type: "ai_diagnosis" | "physician_consultation"
      message_type: "text" | "image" | "file"
      subscription_plan: "basic" | "premium" | "enterprise"
      user_role: "patient" | "physician" | "hospital_admin" | "agent" | "admin"
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
  public: {
    Enums: {
      appointment_status: ["pending", "confirmed", "cancelled", "completed"],
      conversation_type: ["ai_diagnosis", "physician_consultation"],
      message_type: ["text", "image", "file"],
      subscription_plan: ["basic", "premium", "enterprise"],
      user_role: ["patient", "physician", "hospital_admin", "agent", "admin"],
    },
  },
} as const
