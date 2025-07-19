-- Database initialization script for Docker
-- This file is automatically executed when PostgreSQL container starts for the first time

-- Create database if it doesn't exist (handled by Docker environment variables)
-- The database is created automatically via POSTGRES_DB environment variable

-- Set timezone
SET timezone = 'UTC';

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a test connection function
CREATE OR REPLACE FUNCTION test_connection() 
RETURNS TEXT AS $$
BEGIN
    RETURN 'Database connection successful at ' || NOW();
END;
$$ LANGUAGE plpgsql;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Open Era Database initialized successfully at %', NOW();
END $$;
