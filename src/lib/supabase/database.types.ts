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
          billing_customer_id: string | null
          billing_subscription_id: string | null
          billing_provider: string | null
          subscription_status: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean | null
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
          billing_customer_id?: string | null
          billing_subscription_id?: string | null
          billing_provider?: string | null
          subscription_status?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
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
          billing_customer_id?: string | null
          billing_subscription_id?: string | null
          billing_provider?: string | null
          subscription_status?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean | null
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
          status: "queued" | "sent" | "failed" | "clicked" | "reviewed"
          sent_at: string | null
          first_clicked_at: string | null
          click_count: number
          reminder_sent_at: string | null
          reminder_claimed_at: string | null
          manually_marked_reviewed: boolean
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          customer_id: string
          short_code: string
          status?: "queued" | "sent" | "failed" | "clicked" | "reviewed"
          sent_at?: string | null
          first_clicked_at?: string | null
          click_count?: number
          reminder_sent_at?: string | null
          reminder_claimed_at?: string | null
          manually_marked_reviewed?: boolean
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          customer_id?: string
          short_code?: string
          status?: "queued" | "sent" | "failed" | "clicked" | "reviewed"
          sent_at?: string | null
          first_clicked_at?: string | null
          click_count?: number
          reminder_sent_at?: string | null
          reminder_claimed_at?: string | null
          manually_marked_reviewed?: boolean
          error_message?: string | null
          created_at?: string
        }
      }
      message_templates: {
        Row: {
          id: string
          business_id: string
          request_subject: string
          request_body: string
          reminder_subject: string
          reminder_body: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          request_subject?: string
          request_body?: string
          reminder_subject?: string
          reminder_body?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          request_subject?: string
          request_body?: string
          reminder_subject?: string
          reminder_body?: string
          updated_at?: string
        }
      }
      click_events: {
        Row: {
          id: string
          request_id: string
          ip_hash: string | null
          user_agent: string | null
          is_bot: boolean
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          ip_hash?: string | null
          user_agent?: string | null
          is_bot?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          ip_hash?: string | null
          user_agent?: string | null
          is_bot?: boolean
          created_at?: string
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
