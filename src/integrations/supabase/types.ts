export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_assisted_patients: {
        Row: {
          agent_id: string
          assistance_type: string
          created_at: string | null
          description: string | null
          id: string
          patient_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          assistance_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          patient_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          assistance_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
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
          appointment_date: string
          appointment_time: string
          consultation_type: Database["public"]["Enums"]["consultation_type"] | null
          created_at: string | null
          hospital_id: string | null
          id: string
          notes: string | null
          patient_id: string
          physician_id: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          consultation_type?: Database["public"]["Enums"]["consultation_type"] | null
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          physician_id: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          consultation_type?: Database["public"]["Enums"]["consultation_type"] | null
          created_at?: string | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          physician_id?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
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
      consultations: {
        Row: {
          id: string
          appointment_id: string
          patient_id: string
          physician_id: string
          consultation_notes: string | null
          status: Database["public"]["Enums"]["consultation_status"] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          patient_id: string
          physician_id: string
          consultation_notes?: string | null
          status?: Database["public"]["Enums"]["consultation_status"] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          patient_id?: string
          physician_id?: string
          consultation_notes?: string | null
          status?: Database["public"]["Enums"]["consultation_status"] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_physician_id_fkey"
            columns: ["physician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          state: string | null
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
          state?: string | null
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
          state?: string | null
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
      patient_physician_interactions: {
        Row: {
          id: string
          patient_id: string
          physician_id: string
          consultation_id: string | null
          prescription_id: string | null
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          interaction_date: string
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          physician_id: string
          consultation_id?: string | null
          prescription_id?: string | null
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          interaction_date: string
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          physician_id?: string
          consultation_id?: string | null
          prescription_id?: string | null
          interaction_type?: Database["public"]["Enums"]["interaction_type"]
          interaction_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_physician_interactions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_physician_interactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_physician_interactions_physician_id_fkey"
            columns: ["physician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_physician_interactions_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
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
          created_at: string | null
          email: string
          first_name: string | null
          hospital_id: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          license_number: string | null
          location_latitude: number | null
          location_longitude: number | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          specialization: string | null
          state: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          hospital_id?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          license_number?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialization?: string | null
          state?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          hospital_id?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          license_number?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialization?: string | null
          state?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
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
          created_at: string | null
          email: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          id: string
          notes: string | null
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          notes?: string | null
          request_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          notes?: string | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_monthly_booking_limit: {
        Args: { patient_uuid: string }
        Returns: number
      }
      generate_hospital_analytics: {
        Args: { hospital_uuid: string }
        Returns: undefined
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
    }
    Enums: {
      appointment_status: "pending" | "confirmed" | "cancelled" | "completed"
      conversation_type: "ai_diagnosis" | "physician_consultation"
      message_type: "text" | "image" | "file"
      subscription_plan: "basic" | "premium" | "enterprise"
      user_role: "patient" | "physician" | "hospital_admin" | "agent" | "admin"
      consultation_status: "scheduled" | "completed" | "cancelled"
      interaction_type: "consultation" | "prescription"
      consultation_type: "virtual" | "in_person"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
      consultation_status: ["scheduled", "completed", "cancelled"],
      interaction_type: ["consultation", "prescription"],
      consultation_type: ["virtual", "in_person"],
    },
  },
} as const
