-- Initialize Secure Aura Database Schema

-- Create database if it doesn't exist (will be created by POSTGRES_DB env var)
-- This file initializes the schema for the 'timing_defense' database

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table with secure password storage
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(512) NOT NULL,
    salt VARCHAR(128) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMP,
    account_locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Admin users table for dashboard authentication
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(512) NOT NULL,
    salt VARCHAR(128) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Audit log for all authentication attempts
CREATE TABLE IF NOT EXISTS auth_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    username_attempted VARCHAR(255),
    event_type VARCHAR(50) NOT NULL, -- login_success, login_failure, token_validation, etc.
    ip_address INET NOT NULL,
    user_agent TEXT,
    processing_time_ms REAL NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Timing analysis table for detecting attacks
CREATE TABLE IF NOT EXISTS timing_analysis (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    username_attempted VARCHAR(255),
    request_count INTEGER DEFAULT 1,
    avg_processing_time REAL,
    std_dev_processing_time REAL,
    min_processing_time REAL,
    max_processing_time REAL,
    timing_variance REAL,
    attack_probability REAL,
    is_suspicious BOOLEAN DEFAULT false,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security events table for detected attacks
CREATE TABLE IF NOT EXISTS security_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL, -- timing_attack, brute_force, enumeration, etc.
    severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
    ip_address INET NOT NULL,
    username_target VARCHAR(255),
    attack_vector TEXT,
    confidence_score REAL,
    evidence JSONB,
    mitigation_applied VARCHAR(255),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL, -- IP address or user ID
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP NOT NULL,
    blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, endpoint, window_start)
);

-- API tokens table
CREATE TABLE IF NOT EXISTS api_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(512) NOT NULL,
    token_name VARCHAR(255),
    scopes TEXT[],
    expires_at TIMESTAMP,
    last_used TIMESTAMP,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(255) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX idx_auth_logs_ip_address ON auth_logs(ip_address);
CREATE INDEX idx_auth_logs_created_at ON auth_logs(created_at);
CREATE INDEX idx_auth_logs_event_type ON auth_logs(event_type);

CREATE INDEX idx_timing_analysis_ip ON timing_analysis(ip_address);
CREATE INDEX idx_timing_analysis_suspicious ON timing_analysis(is_suspicious);
CREATE INDEX idx_timing_analysis_window ON timing_analysis(window_start, window_end);

CREATE INDEX idx_security_events_ip ON security_events(ip_address);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_created ON security_events(created_at);
CREATE INDEX idx_security_events_resolved ON security_events(resolved);

CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

CREATE INDEX idx_api_tokens_user ON api_tokens(user_id);
CREATE INDEX idx_api_tokens_expires ON api_tokens(expires_at);

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
    ('timing_defense', '{"min_noise_ms": 50, "max_noise_ms": 200, "constant_delay_ms": 100, "enabled": true}', 'Timing attack defense settings'),
    ('rate_limiting', '{"max_requests_per_minute": 60, "max_failed_logins": 5, "lockout_duration_minutes": 15}', 'Rate limiting and account lockout settings'),
    ('detection', '{"threshold": 0.75, "analysis_window_seconds": 300, "min_samples": 10}', 'Attack detection thresholds'),
    ('security_levels', '{"low": {"noise_ms": 50}, "medium": {"noise_ms": 100}, "high": {"noise_ms": 200}}', 'Security level configurations')
ON CONFLICT (config_key) DO NOTHING;

-- Insert demo admin user (password: SecureAdmin123!)
-- Password hash is for demonstration - in production, this should be created through the API
INSERT INTO users (username, email, password_hash, salt, is_admin) VALUES
    ('admin', 'admin@secureaura.local', 
     'pbkdf2_sha256$260000$demo_salt_value$hashed_password_placeholder',
     'demo_salt_value',
     true)
ON CONFLICT (username) DO NOTHING;

-- Insert default admin for dashboard (username: secureadmin, password: superadmin123)
-- Using bcrypt hash for the password
INSERT INTO admins (username, password_hash, salt, is_active) VALUES
    ('secureadmin', 
     '$2b$10$6QqFPgAvtvyMlPV38PNMCOj8dnHXpjE1ILoLFUqQgVff/v.A0E8Wi',
     'bcrypt_salt_included_in_hash',
     true)
ON CONFLICT (username) DO NOTHING;

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timing_analysis_updated_at BEFORE UPDATE ON timing_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
