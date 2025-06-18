
-- Create notices table for admin announcements
CREATE TABLE public.notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- Add RLS policies for notices
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to read active notices
CREATE POLICY "Users can view active notices" 
  ON public.notices 
  FOR SELECT 
  TO authenticated
  USING (is_active = true);

-- Policy to allow admins to manage all notices
CREATE POLICY "Admins can manage all notices" 
  ON public.notices 
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for better performance
CREATE INDEX idx_notices_active ON public.notices(is_active, created_at DESC);
CREATE INDEX idx_notices_created_by ON public.notices(created_by);

-- Add seat change request reason column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'seat_change_requests' 
                 AND column_name = 'reason') THEN
    ALTER TABLE seat_change_requests ADD COLUMN reason TEXT;
  END IF;
END $$;

-- Add membership duration to seat_bookings table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'seat_bookings' 
                 AND column_name = 'membership_duration_days') THEN
    ALTER TABLE seat_bookings ADD COLUMN membership_duration_days INTEGER DEFAULT 30;
  END IF;
END $$;
