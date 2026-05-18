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
          role: 'WAITING' | 'REGULAR' | 'PACER' | 'ADMIN'
          is_active: boolean
          is_exempted: boolean
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          kakao_id: string
          nickname: string
          role?: 'WAITING' | 'REGULAR' | 'PACER' | 'ADMIN'
          is_active?: boolean
          is_exempted?: boolean
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          kakao_id?: string
          nickname?: string
          role?: 'WAITING' | 'REGULAR' | 'PACER' | 'ADMIN'
          is_active?: boolean
          is_exempted?: boolean
          phone?: string | null
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
        }
        Insert: {
          id?: string
          name: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_active?: boolean
          created_at?: string
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
    }
    Enums: {
      user_role: 'WAITING' | 'REGULAR' | 'PACER' | 'ADMIN'
      run_type: 'PERSONAL' | 'REGULAR'
      marathon_category: 'TEN_K' | 'HALF' | 'FULL'
    }
  }
}
