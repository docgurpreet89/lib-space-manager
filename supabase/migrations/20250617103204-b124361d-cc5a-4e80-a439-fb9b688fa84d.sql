
-- Set the default timezone for the database session to Asia/Kolkata
ALTER DATABASE postgres SET timezone TO 'Asia/Kolkata';

-- Update any existing timestamp columns to use timestamptz for better timezone handling
-- This ensures all new timestamps will be stored with timezone awareness
