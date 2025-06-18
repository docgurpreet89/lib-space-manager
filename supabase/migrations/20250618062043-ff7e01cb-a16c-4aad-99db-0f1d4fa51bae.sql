
-- Convert all existing timestamp data to Asia/Kolkata timezone
-- and ensure all timestamp columns use timestamptz for proper timezone handling

-- Update seat_bookings table
UPDATE seat_bookings 
SET from_time = from_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
    to_time = to_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE from_time IS NOT NULL OR to_time IS NOT NULL OR created_at IS NOT NULL;

-- Update profiles table
UPDATE profiles 
SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE created_at IS NOT NULL OR updated_at IS NOT NULL;

-- Update seat_change_requests table
UPDATE seat_change_requests 
SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE created_at IS NOT NULL;

-- Update seat_holds table
UPDATE seat_holds 
SET lock_expiry = lock_expiry AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata',
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE lock_expiry IS NOT NULL OR created_at IS NOT NULL;

-- Update seat_images table
UPDATE seat_images 
SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE created_at IS NOT NULL;

-- Update seats table
UPDATE seats 
SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE created_at IS NOT NULL;

-- Update transactions table
UPDATE transactions 
SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE created_at IS NOT NULL;

-- Update user_roles table
UPDATE user_roles 
SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE created_at IS NOT NULL;

-- Update library_settings table
UPDATE library_settings 
SET updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
WHERE updated_at IS NOT NULL;

-- Set default timezone for new sessions to ensure all future timestamps use Asia/Kolkata
SET timezone = 'Asia/Kolkata';

-- Update default values for timestamp columns to use Asia/Kolkata timezone
-- Note: This ensures new records automatically use the correct timezone

-- For profiles table
ALTER TABLE profiles ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');
ALTER TABLE profiles ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

-- For seat_change_requests table
ALTER TABLE seat_change_requests ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

-- For seat_holds table
ALTER TABLE seat_holds ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

-- For seat_images table
ALTER TABLE seat_images ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

-- For seats table
ALTER TABLE seats ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

-- For transactions table
ALTER TABLE transactions ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

-- For user_roles table
ALTER TABLE user_roles ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

-- For library_settings table
ALTER TABLE library_settings ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');

-- For seat_bookings table
ALTER TABLE seat_bookings ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata');
