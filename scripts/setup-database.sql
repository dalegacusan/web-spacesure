-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('driver', 'establishment', 'admin')),
    phone_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    account_available_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50) NOT NULL,
    year_make_model VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Parking_Spaces table
CREATE TABLE IF NOT EXISTS parking_spaces (
    parking_space_id SERIAL PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    establishment_name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    total_spaces INTEGER NOT NULL,
    available_spaces INTEGER NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    whole_day_rate DECIMAL(10,2) NOT NULL,
    availability_status VARCHAR(50) NOT NULL DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    isdeleted BOOLEAN DEFAULT FALSE
);

-- Create Reservations table
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    parking_space_id INTEGER REFERENCES parking_spaces(parking_space_id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reservation_type VARCHAR(50) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    whole_day_rate DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    discount_note VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Payments table
CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    reservation_id INTEGER REFERENCES reservations(reservation_id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL
);

-- Create Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    parking_space_id INTEGER REFERENCES parking_spaces(parking_space_id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    message VARCHAR(500) NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_status VARCHAR(20) DEFAULT 'unread'
);

-- Create Admin_Log table
CREATE TABLE IF NOT EXISTS admin_log (
    log_id SERIAL PRIMARY KEY,
    admin_user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_description VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Parking_Space_Admins table
CREATE TABLE IF NOT EXISTS parking_space_admins (
    parking_space_admin_id SERIAL PRIMARY KEY,
    parking_space_id INTEGER REFERENCES parking_spaces(parking_space_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_by_user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate_number ON vehicles(plate_number);
CREATE INDEX IF NOT EXISTS idx_parking_spaces_city ON parking_spaces(city);
CREATE INDEX IF NOT EXISTS idx_parking_spaces_availability ON parking_spaces(availability_status);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_parking_space_id ON reservations(parking_space_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_parking_space_id ON feedback(parking_space_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_admin_user_id ON admin_log(admin_user_id);

-- Delete existing users if they exist (to avoid conflicts)
DELETE FROM users WHERE email IN ('admin@parkingsystem.com', 'establishment@parkingsystem.com', 'driver@parkingsystem.com');

-- Insert sample users with correctly hashed passwords
-- Password for all users is: admin123
-- Hash generated using bcrypt with salt rounds 12
INSERT INTO users (first_name, last_name, email, password, role, phone_number) VALUES
('Admin', 'User', 'admin@parkingsystem.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 'admin', '+1234567890'),
('John', 'Establishment', 'establishment@parkingsystem.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 'establishment', '+1234567891'),
('Jane', 'Driver', 'driver@parkingsystem.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', 'driver', '+1234567892');

-- Insert sample parking spaces
INSERT INTO parking_spaces (city, establishment_name, address, total_spaces, available_spaces, hourly_rate, whole_day_rate) VALUES
('New York', 'Central Mall Parking', '123 Main St, New York, NY', 100, 85, 5.00, 25.00),
('Los Angeles', 'Downtown Plaza', '456 Broadway, Los Angeles, CA', 150, 120, 4.50, 22.00),
('Chicago', 'City Center Garage', '789 State St, Chicago, IL', 200, 180, 6.00, 30.00);

-- Insert sample vehicles for the driver user
INSERT INTO vehicles (user_id, vehicle_type, year_make_model, color, plate_number) VALUES
(3, 'Sedan', '2020 Toyota Camry', 'Blue', 'ABC123'),
(3, 'SUV', '2019 Honda CR-V', 'White', 'XYZ789');
