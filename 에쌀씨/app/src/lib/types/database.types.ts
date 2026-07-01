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
      profiles: {
        Row: {
          id: string
          kakao_id: string
          nickname: string
          role: 'WAITING' | 'REGULAR' | 'PACER' | 'ADMIN' | 'OWNER' | 'STAFF' | 'PACER_LEADER'
          is_active: boolean
          is_exempted: boolean
          phone: string | null
          status_text: string | null
          admin_memo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          kakao_id: string
          nickname: string
          role?: 'WAITING' | 'REGULAR' | 'PACER' | 'ADMIN' | 'OWNER' | 'STAFF' | 'PACER_LEADER'
          is_active?: boolean
          is_exempted?: boolean
          phone?: string | null
          status_text?: string | null
          admin_memo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          kakao_id?: string
          nickname?: string
          role?: 'WAITING' | 'REGULAR' | 'PACER' | 'ADMIN' | 'OWNER' | 'STAFF' | 'PACER_LEADER'
          is_active?: boolean
          is_exempted?: boolean
          phone?: string | null
          status_text?: string | null
          admin_memo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dues: {
        Row: {
          id: string
          user_id: string
          target_month: string
          status: 'UNPAID' | 'PENDING' | 'PAID' | 'REFUNDED'
          amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_month: string
          status?: 'UNPAID' | 'PENDING' | 'PAID' | 'REFUNDED'
          amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_month?: string
          status?: 'UNPAID' | 'PENDING' | 'PAID' | 'REFUNDED'
          amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          category: string
          description: string
          amount: number
          expense_date: string
          bank_account: string
          receipt_image_url: string | null
          status: 'PENDING' | 'APPROVED' | 'REJECTED'
          claimant_name: string | null
          claimant_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          description: string
          amount: number
          expense_date: string
          bank_account: string
          receipt_image_url?: string | null
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          claimant_name?: string | null
          claimant_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          description?: string
          amount?: number
          expense_date?: string
          bank_account?: string
          receipt_image_url?: string | null
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          claimant_name?: string | null
          claimant_phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      finance_summaries: {
        Row: {
          id: string
          target_month: string
          previous_balance: number
          is_expenses_visible: boolean
          is_balance_visible: boolean
          is_dues_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          target_month: string
          previous_balance?: number
          is_expenses_visible?: boolean
          is_balance_visible?: boolean
          is_dues_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          target_month?: string
          previous_balance?: number
          is_expenses_visible?: boolean
          is_balance_visible?: boolean
          is_dues_visible?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          is_active: boolean
          created_at: string
          address: string | null
          parking_info: string | null
          map_url: string | null
        }
        Insert: {
          id?: string
          name: string
          is_active?: boolean
          created_at?: string
          address?: string | null
          parking_info?: string | null
          map_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          is_active?: boolean
          created_at?: string
          address?: string | null
          parking_info?: string | null
          map_url?: string | null
        }
      }
      running_records: {
        Row: {
          id: string
          user_id: string
          run_date: string
          distance_km: number
          location_id: string | null
          location_name_snapshot: string
          run_type: 'PERSONAL' | 'REGULAR'
          is_pacing: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          run_date: string
          distance_km: number
          location_id?: string | null
          location_name_snapshot: string
          run_type: 'PERSONAL' | 'REGULAR'
          is_pacing?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          run_date?: string
          distance_km?: number
          location_id?: string | null
          location_name_snapshot?: string
          run_type?: 'PERSONAL' | 'REGULAR'
          is_pacing?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      marathon_pbs: {
        Row: {
          id: string
          user_id: string
          category: 'TEN_K' | 'HALF' | 'FULL'
          record_time: string  // interval → ISO 8601 duration string
          achieved_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: 'TEN_K' | 'HALF' | 'FULL'
          record_time: string
          achieved_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: 'TEN_K' | 'HALF' | 'FULL'
          record_time?: string
          achieved_at?: string | null
          updated_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          title: string
          start_date: string
          time: string | null
          location: string | null
          schedule_type: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          start_date: string
          time?: string | null
          location?: string | null
          schedule_type: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          start_date?: string
          time?: string | null
          location?: string | null
          schedule_type?: string
          created_by?: string
          created_at?: string
        }
      }
      system_settings: {
        Row: {
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          setting_key?: string
          setting_value?: string
          created_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          item_name: string
          quantity: number
          condition: string
          manager_name: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_name: string
          quantity?: number
          condition?: string
          manager_name?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          item_name?: string
          quantity?: number
          condition?: string
          manager_name?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      marathon_participants: {
        Row: {
          id: string
          user_id: string
          marathon_name: string
          marathon_date: string
          course: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          marathon_name: string
          marathon_date: string
          course: string
          created_at?: string
        }
        Update: {
          marathon_name?: string
          marathon_date?: string
          course?: string
        }
      }
      suggestions: {
        Row: {
          id: string
          user_id: string | null
          is_anonymous: boolean
          title: string
          content: string
          status: string
          admin_reply: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          is_anonymous?: boolean
          title: string
          content: string
          status?: string
          admin_reply?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: string
          admin_reply?: string | null
          updated_at?: string
        }
      }
    }
    Enums: {
      user_role: 'WAITING' | 'REGULAR' | 'PACER' | 'ADMIN' | 'OWNER' | 'STAFF' | 'PACER_LEADER'
      run_type: 'PERSONAL' | 'REGULAR'
      marathon_category: 'TEN_K' | 'HALF' | 'FULL'
    }
  }
}
