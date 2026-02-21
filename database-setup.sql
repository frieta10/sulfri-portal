-- ============================================
-- Sulfri Trainer Portal - Database Setup Script
-- ============================================
-- This script creates all necessary tables, enums, indexes, and seed data
-- Run this in pgAdmin or any PostgreSQL client

-- Create database (run this separately if database doesn't exist)
-- CREATE DATABASE sulfri_portal;

-- Connect to the database before running the rest
-- \c sulfri_portal

-- ============================================
-- 1. CREATE ENUMS
-- ============================================

CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'CORPORATE', 'GOVERNMENT', 'ACADEMIC');
CREATE TYPE "ClassMode" AS ENUM ('ONLINE', 'IN_PERSON', 'HYBRID');
CREATE TYPE "ClassStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- Admin Users Table
CREATE TABLE admin_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin' NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Classes Table
CREATE TABLE classes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_type "ClientType" NOT NULL,
    topic_category TEXT NOT NULL,
    mode "ClassMode" NOT NULL,
    location TEXT,
    start_datetime TIMESTAMP(3) NOT NULL,
    end_datetime TIMESTAMP(3) NOT NULL,
    notes TEXT,
    status "ClassStatus" DEFAULT 'UPCOMING' NOT NULL,
    join_code TEXT UNIQUE NOT NULL,
    join_enabled BOOLEAN DEFAULT true NOT NULL,
    show_on_public_profile BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Registrations Table
CREATE TABLE registrations (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    organization TEXT,
    consent_flag BOOLEAN NOT NULL,
    registered_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Downloads Table
CREATE TABLE downloads (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false NOT NULL,
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Profile Settings Table (Single Row)
CREATE TABLE profile_settings (
    id TEXT PRIMARY KEY DEFAULT 'singleton',
    display_name TEXT NOT NULL,
    headline TEXT,
    bio TEXT,
    email TEXT,
    phone TEXT,
    linkedin_url TEXT,
    location_base TEXT,
    profile_photo_url TEXT,
    last_updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

-- Classes indexes
CREATE INDEX idx_classes_join_code ON classes(join_code);
CREATE INDEX idx_classes_status ON classes(status);
CREATE INDEX idx_classes_start_datetime ON classes(start_datetime);

-- Registrations indexes
CREATE INDEX idx_registrations_class_id ON registrations(class_id);
CREATE INDEX idx_registrations_email ON registrations(email);

-- ============================================
-- 4. CREATE UPDATE TRIGGER FOR updated_at
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for classes table
CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for downloads table
CREATE TRIGGER update_downloads_updated_at
    BEFORE UPDATE ON downloads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for profile_settings table
CREATE TRIGGER update_profile_settings_updated_at
    BEFORE UPDATE ON profile_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. INSERT SEED DATA
-- ============================================

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO admin_users (id, name, email, password_hash, role, created_at)
VALUES (
    'admin001',
    'Admin User',
    'admin@sulfri.com',
    '$2a$10$rGJ5qKJZ5kH5Y5Y5Y5Y5YOK5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y',
    'admin',
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Insert default profile settings
INSERT INTO profile_settings (id, display_name, headline, bio, last_updated_at)
VALUES (
    'singleton',
    'Sulfri Trainer',
    'Professional Trainer & Consultant',
    'Experienced professional trainer specializing in corporate training and development.',
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. VERIFY INSTALLATION
-- ============================================

-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check admin user
SELECT id, name, email, role, created_at
FROM admin_users;

-- Check profile settings
SELECT id, display_name, headline
FROM profile_settings;

-- ============================================
-- SETUP COMPLETE!
-- ============================================

-- Default Admin Credentials:
-- Email: admin@sulfri.com
-- Password: admin123
--
-- Note: The password hash above is a placeholder.
-- You'll need to run the seed script with bcrypt to generate the correct hash.
-- Use: npm run prisma:seed (after configuring DATABASE_URL in .env.local)
