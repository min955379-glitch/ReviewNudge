export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          owner_id: string
          name: string
          google_review_url: string
          reply_to_email: string | null
          contact_line: string | null
          mailing_address: string
          timezone: string
          plan: "free" | "pro" | "business"
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          google_review_url: string
          reply_to_email?: string | null
          contact_line?: string | null
          mailing_address?: string
          timezone?: string
          plan?: "free" | "pro" | "business"
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          google_review_url?: string
          reply_to_email?: string | null
          contact_line?: string | null
          mailing_address?: string
          timezone?: string
          plan?: "free" | "pro" | "business"
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          business_id: string
          name: string
          email: string | null
          phone: string | null
          consent_confirmed: boolean
          unsubscribed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          email?: string | null
          phone?: string | null
          consent_confirmed?: boolean
          unsubscribed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          consent_confirmed?: boolean
          unsubscribed?: boolean
          created_at?: string
        }
      }
      review_requests: {
        Row: {
          id: string
          business_id: string
          customer_id: string
          short_code: string
          status: "queued" | "sent" | "failed" | "clicked"
          sent_at: string | null
          first_clicked_at: string | null
          click_count: number
          reminder_sent_at: string | null
          manually_marked_reviewed: boolean
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          customer_id: string
          short_code: string
          status?: "queued" | "sent" | "failed" | "clicked"
          sent_at?: string | null
          first_clicked_at?: string | null
          click_count?: number
          reminder_sent_at?: string | null
          manually_marked_reviewed?: boolean
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          customer_id?: string
          short_code?: string
          status?: "queued" | "sent" | "failed" | "clicked"
          sent_at?: string | null
          first_clicked_at?: string | null
          click_count?: number
          reminder_sent_at?: string | null
          manually_marked_reviewed?: boolean
          error_message?: string | null
          created_at?: string
        }
      }
      message_templates: {
        Row: {
          id: string
          business_id: string
          kind: "request" | "reminder"
          subject: string
          body: string
        }
        Insert: {
          id?: string
          business_id: string
          kind: "request" | "reminder"
          subject: string
          body: string
        }
        Update: {
          id?: string
          business_id?: string
          kind?: "request" | "reminder"
          subject?: string
          body?: string
        }
      }
      unsubscribes: {
        Row: {
          id: string
          business_id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          email?: string
          created_at?: string
        }
      }
      click_events: {
        Row: {
          id: string
          review_request_id: string
          clicked_at: string
          user_agent: string | null
        }
        Insert: {
          id?: string
          review_request_id: string
          clicked_at?: string
          user_agent?: string | null
        }
        Update: {
          id?: string
          review_request_id?: string
          clicked_at?: string
          user_agent?: string | null
        }
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
  }
}
