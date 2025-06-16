
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Seat {
  seat_id: string;
  seat_label: string;
  seat_image_id?: string;
}

export interface SeatBooking {
  booking_id: string;
  seat_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  from_time: string;
  to_time: string;
  status: 'pending' | 'approved' | 'cancelled';
  created_at: string;
}

export interface SeatHold {
  hold_id: string;
  seat_id: string;
  user_id: string;
  lock_expiry: string;
  created_at: string;
}

export interface Transaction {
  transaction_id: string;
  user_id: string;
  booking_id?: string;
  amount: number;
  status: 'success' | 'failed';
  description: string;
  created_at: string;
}

export interface SeatChangeRequest {
  request_id: string;
  booking_id: string;
  old_seat_id: string;
  new_seat_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'cancelled';
  created_at: string;
}

export interface LibrarySettings {
  setting_name: string;
  setting_value: string;
}

export interface UserRole {
  user_id: string;
  role: 'user' | 'admin';
}
