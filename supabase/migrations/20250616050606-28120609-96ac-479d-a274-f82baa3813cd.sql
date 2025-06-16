
-- Database schema and functions for the Library Seat Booking System

-- Create tables
CREATE TABLE IF NOT EXISTS seats (
    seat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seat_label VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seat_bookings (
    booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seat_id UUID REFERENCES seats(seat_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_phone VARCHAR(20) NOT NULL,
    from_time TIMESTAMP WITH TIME ZONE NOT NULL,
    to_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seat_holds (
    hold_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seat_id UUID REFERENCES seats(seat_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    lock_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    booking_id UUID REFERENCES seat_bookings(booking_id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seat_change_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES seat_bookings(booking_id) ON DELETE CASCADE,
    old_seat_id UUID REFERENCES seats(seat_id),
    new_seat_id UUID REFERENCES seats(seat_id),
    user_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS library_settings (
    setting_name VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID PRIMARY KEY,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seat_images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seat_id UUID REFERENCES seats(seat_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default library settings
INSERT INTO library_settings (setting_name, setting_value) VALUES
('seat_lock_duration_minutes', '30'),
('monthly_rate_default', '50.00'),
('seat_change_fee', '5.00'),
('library_timings', '9:00 AM - 10:00 PM')
ON CONFLICT (setting_name) DO NOTHING;

-- Insert sample seats
INSERT INTO seats (seat_label) VALUES
('A1'), ('A2'), ('A3'), ('A4'), ('A5'), ('A6'), ('A7'), ('A8'),
('B1'), ('B2'), ('B3'), ('B4'), ('B5'), ('B6'), ('B7'), ('B8'),
('C1'), ('C2'), ('C3'), ('C4'), ('C5'), ('C6'), ('C7'), ('C8'),
('D1'), ('D2'), ('D3'), ('D4'), ('D5'), ('D6'), ('D7'), ('D8')
ON CONFLICT (seat_label) DO NOTHING;

-- Function: book_seat
CREATE OR REPLACE FUNCTION book_seat(
    p_seat_id UUID,
    p_user_id UUID,
    p_user_name TEXT,
    p_user_email TEXT,
    p_user_phone TEXT,
    p_from_time TIMESTAMP WITH TIME ZONE,
    p_to_time TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
DECLARE
    v_lock_duration INTEGER;
    v_lock_expiry TIMESTAMP WITH TIME ZONE;
    existing_booking BOOLEAN := FALSE;
    existing_hold BOOLEAN := FALSE;
BEGIN
    -- Get lock duration from settings
    SELECT CAST(setting_value AS INTEGER) INTO v_lock_duration
    FROM library_settings 
    WHERE setting_name = 'seat_lock_duration_minutes';
    
    IF v_lock_duration IS NULL THEN
        v_lock_duration := 30; -- Default fallback
    END IF;
    
    -- Calculate lock expiry
    v_lock_expiry := NOW() + (v_lock_duration || ' minutes')::INTERVAL;
    
    -- Check for overlapping approved bookings
    SELECT EXISTS(
        SELECT 1 FROM seat_bookings 
        WHERE seat_id = p_seat_id 
        AND status = 'approved'
        AND (
            (p_from_time >= from_time AND p_from_time < to_time) OR
            (p_to_time > from_time AND p_to_time <= to_time) OR
            (p_from_time <= from_time AND p_to_time >= to_time)
        )
    ) INTO existing_booking;
    
    IF existing_booking THEN
        RAISE EXCEPTION 'Seat has overlapping approved booking';
    END IF;
    
    -- Check for active holds
    SELECT EXISTS(
        SELECT 1 FROM seat_holds 
        WHERE seat_id = p_seat_id 
        AND lock_expiry > NOW()
    ) INTO existing_hold;
    
    IF existing_hold THEN
        RAISE EXCEPTION 'Seat is currently on hold';
    END IF;
    
    -- Insert seat hold
    INSERT INTO seat_holds (seat_id, user_id, lock_expiry)
    VALUES (p_seat_id, p_user_id, v_lock_expiry);
    
    -- Insert booking as pending
    INSERT INTO seat_bookings (
        seat_id, user_id, user_name, user_email, user_phone,
        from_time, to_time, status
    ) VALUES (
        p_seat_id, p_user_id, p_user_name, p_user_email, p_user_phone,
        p_from_time, p_to_time, 'pending'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: confirm_booking
CREATE OR REPLACE FUNCTION confirm_booking(p_booking_id UUID) RETURNS BOOLEAN AS $$
DECLARE
    v_seat_id UUID;
    v_user_id UUID;
    v_monthly_rate DECIMAL(10,2);
BEGIN
    -- Get booking details
    SELECT seat_id, user_id INTO v_seat_id, v_user_id
    FROM seat_bookings 
    WHERE booking_id = p_booking_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found or not pending';
    END IF;
    
    -- Update booking status to approved
    UPDATE seat_bookings 
    SET status = 'approved' 
    WHERE booking_id = p_booking_id;
    
    -- Remove related holds
    DELETE FROM seat_holds 
    WHERE seat_id = v_seat_id AND user_id = v_user_id;
    
    -- Get monthly rate
    SELECT CAST(setting_value AS DECIMAL(10,2)) INTO v_monthly_rate
    FROM library_settings 
    WHERE setting_name = 'monthly_rate_default';
    
    IF v_monthly_rate IS NULL THEN
        v_monthly_rate := 50.00; -- Default fallback
    END IF;
    
    -- Create successful transaction
    INSERT INTO transactions (user_id, booking_id, amount, status, description)
    VALUES (v_user_id, p_booking_id, v_monthly_rate, 'success', 'Seat booking approved');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: cancel_booking
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID) RETURNS BOOLEAN AS $$
DECLARE
    v_seat_id UUID;
    v_user_id UUID;
BEGIN
    -- Get booking details
    SELECT seat_id, user_id INTO v_seat_id, v_user_id
    FROM seat_bookings 
    WHERE booking_id = p_booking_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found or not pending';
    END IF;
    
    -- Update booking status to cancelled
    UPDATE seat_bookings 
    SET status = 'cancelled' 
    WHERE booking_id = p_booking_id;
    
    -- Remove related holds
    DELETE FROM seat_holds 
    WHERE seat_id = v_seat_id AND user_id = v_user_id;
    
    -- Create failed transaction
    INSERT INTO transactions (user_id, booking_id, amount, status, description)
    VALUES (v_user_id, p_booking_id, 0, 'failed', 'Seat booking cancelled');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: cleanup_expired_holds
CREATE OR REPLACE FUNCTION cleanup_expired_holds() RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER := 0;
    expired_booking RECORD;
BEGIN
    -- Get all bookings with expired holds
    FOR expired_booking IN 
        SELECT DISTINCT sb.booking_id, sb.user_id
        FROM seat_bookings sb
        JOIN seat_holds sh ON sb.seat_id = sh.seat_id AND sb.user_id = sh.user_id
        WHERE sb.status = 'pending' 
        AND sh.lock_expiry < NOW()
    LOOP
        -- Cancel the booking
        UPDATE seat_bookings 
        SET status = 'cancelled' 
        WHERE booking_id = expired_booking.booking_id;
        
        -- Create failed transaction
        INSERT INTO transactions (user_id, booking_id, amount, status, description)
        VALUES (expired_booking.user_id, expired_booking.booking_id, 0, 'failed', 'Booking expired - hold timeout');
        
        expired_count := expired_count + 1;
    END LOOP;
    
    -- Delete expired holds
    DELETE FROM seat_holds WHERE lock_expiry < NOW();
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: approve_seat_change
CREATE OR REPLACE FUNCTION approve_seat_change(p_request_id UUID) RETURNS BOOLEAN AS $$
DECLARE
    v_booking_id UUID;
    v_new_seat_id UUID;
    v_user_id UUID;
    v_change_fee DECIMAL(10,2);
BEGIN
    -- Get request details
    SELECT booking_id, new_seat_id, user_id 
    INTO v_booking_id, v_new_seat_id, v_user_id
    FROM seat_change_requests 
    WHERE request_id = p_request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Seat change request not found or not pending';
    END IF;
    
    -- Update booking with new seat
    UPDATE seat_bookings 
    SET seat_id = v_new_seat_id 
    WHERE booking_id = v_booking_id;
    
    -- Update request status
    UPDATE seat_change_requests 
    SET status = 'approved' 
    WHERE request_id = p_request_id;
    
    -- Get change fee
    SELECT CAST(setting_value AS DECIMAL(10,2)) INTO v_change_fee
    FROM library_settings 
    WHERE setting_name = 'seat_change_fee';
    
    IF v_change_fee IS NULL THEN
        v_change_fee := 5.00; -- Default fallback
    END IF;
    
    -- Create transaction for change fee
    INSERT INTO transactions (user_id, booking_id, amount, status, description)
    VALUES (v_user_id, v_booking_id, v_change_fee, 'success', 'Seat change fee');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for seats (read for all authenticated users)
CREATE POLICY "Anyone can view seats" ON seats FOR SELECT TO authenticated USING (true);

-- Policies for seat_bookings (users can view their own, admins can view all)
CREATE POLICY "Users can view own bookings" ON seat_bookings FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" ON seat_bookings FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Users can insert own bookings" ON seat_bookings FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update bookings" ON seat_bookings FOR UPDATE TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Policies for seat_holds (users can view their own, system can manage)
CREATE POLICY "Users can view own holds" ON seat_holds FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage holds" ON seat_holds FOR ALL TO authenticated 
USING (true);

-- Policies for transactions (users can view their own)
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- Policies for seat_change_requests (users can view/insert their own, admins can view/update all)
CREATE POLICY "Users can view own seat change requests" ON seat_change_requests FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create seat change requests" ON seat_change_requests FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all seat change requests" ON seat_change_requests FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admins can update seat change requests" ON seat_change_requests FOR UPDATE TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Policies for library_settings (admins only)
CREATE POLICY "Admins can manage library settings" ON library_settings FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Policies for user_roles (admins can view, system can assign)
CREATE POLICY "Admins can view user roles" ON user_roles FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur2 
        WHERE ur2.user_id = auth.uid() AND ur2.role = 'admin'
    )
);

CREATE POLICY "Users can view own role" ON user_roles FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = id);
