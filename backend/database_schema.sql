-- SmartBets 2.0 Database Schema
-- Complete SQL schema for user authentication and betting system
-- Generated for PostgreSQL (can be adapted for SQLite in development)

-- Enable UUID extension for PostgreSQL
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - Core user authentication and account information
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'free' NOT NULL CHECK (subscription_tier IN ('free', 'premium', 'pro', 'admin')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Verification and password reset
    verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE
);

-- Indexes for users table
CREATE INDEX idx_user_email_active ON users(email, is_active);
CREATE INDEX idx_user_created_at ON users(created_at);
CREATE INDEX idx_user_subscription_tier ON users(subscription_tier);

-- User profiles table - Extended user preferences and settings
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Profile data
    timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
    favorite_sports JSONB DEFAULT '[]' NOT NULL,
    preferred_sportsbooks JSONB DEFAULT '[]' NOT NULL,
    default_bet_amount DECIMAL(10,2) DEFAULT 10.00 NOT NULL,
    risk_tolerance VARCHAR(20) DEFAULT 'medium' NOT NULL CHECK (risk_tolerance IN ('low', 'medium', 'high')),
    
    -- Preferences
    email_notifications BOOLEAN DEFAULT TRUE NOT NULL,
    push_notifications BOOLEAN DEFAULT FALSE NOT NULL,
    marketing_emails BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Analytics preferences
    tracking_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    share_anonymous_data BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for user_profiles table
CREATE INDEX idx_user_profile_user_id ON user_profiles(user_id);

-- Betting history table - Track user's betting history and parlay evaluations
CREATE TABLE betting_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Parlay data
    parlay_data JSONB NOT NULL,
    ai_evaluation JSONB NOT NULL,
    
    -- Bet tracking
    total_amount DECIMAL(10,2) NOT NULL,
    potential_payout DECIMAL(10,2),
    actual_result VARCHAR(20) CHECK (actual_result IN ('win', 'loss', 'push', 'pending')),
    actual_payout DECIMAL(10,2),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'evaluated' NOT NULL CHECK (status IN ('evaluated', 'placed', 'settled')),
    confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    
    -- Metadata
    notes TEXT,
    external_bet_id VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    settled_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for betting_history table
CREATE INDEX idx_betting_history_user_created ON betting_history(user_id, created_at);
CREATE INDEX idx_betting_history_status ON betting_history(status);
CREATE INDEX idx_betting_history_result ON betting_history(actual_result);
CREATE INDEX idx_betting_history_confidence ON betting_history(confidence_score);

-- User sessions table - Track user sessions and JWT tokens
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session data
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    access_token_jti VARCHAR(255),
    refresh_token_jti VARCHAR(255) UNIQUE NOT NULL,
    
    -- Session metadata
    ip_address VARCHAR(45), -- Supports IPv4 and IPv6
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Status and expiration
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for user_sessions table
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id, is_active);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_refresh_jti ON user_sessions(refresh_token_jti);

-- Parlays table - Store and track parlay bets
CREATE TABLE parlays (
    id SERIAL PRIMARY KEY,
    
    -- Parlay identification
    parlay_id VARCHAR(36) UNIQUE NOT NULL, -- UUID
    name VARCHAR(255),
    
    -- Parlay data
    bets JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    potential_payout DECIMAL(10,2),
    combined_odds DECIMAL(10,3),
    
    -- AI Analysis
    ai_confidence DECIMAL(5,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
    ai_recommendation VARCHAR(20) CHECK (ai_recommendation IN ('recommend', 'caution', 'avoid')),
    ai_analysis JSONB,
    
    -- Status and tracking
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'placed', 'won', 'lost', 'push', 'cancelled')),
    result VARCHAR(20),
    actual_payout DECIMAL(10,2),
    
    -- Metadata
    sport_leagues JSONB,
    bet_types JSONB,
    num_legs INTEGER DEFAULT 0 NOT NULL,
    
    -- External tracking
    sportsbook VARCHAR(50),
    external_bet_id VARCHAR(255),
    
    -- Notes and tracking
    notes TEXT,
    tags JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    placed_at TIMESTAMP WITH TIME ZONE,
    settled_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for parlays table
CREATE INDEX idx_parlay_id ON parlays(parlay_id);
CREATE INDEX idx_parlay_created_at ON parlays(created_at);
CREATE INDEX idx_parlay_status ON parlays(status);
CREATE INDEX idx_parlay_sport_leagues ON parlays USING GIN(sport_leagues);
CREATE INDEX idx_parlay_ai_confidence ON parlays(ai_confidence);
CREATE INDEX idx_parlay_num_legs ON parlays(num_legs);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_betting_history_updated_at BEFORE UPDATE ON betting_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parlays_updated_at BEFORE UPDATE ON parlays 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for development (optional)
INSERT INTO users (email, password_hash, name, is_verified, subscription_tier) VALUES
('admin@smartbets.com', 'pbkdf2:sha256:600000$salt$hash', 'Admin User', TRUE, 'admin'),
('demo@smartbets.com', 'pbkdf2:sha256:600000$salt$hash', 'Demo User', TRUE, 'premium');

-- Sample user profiles
INSERT INTO user_profiles (user_id, timezone, favorite_sports, preferred_sportsbooks, default_bet_amount, risk_tolerance) VALUES
(1, 'America/New_York', '["nfl", "nba"]', '["draftkings", "fanduel"]', 25.00, 'medium'),
(2, 'America/Los_Angeles', '["nfl", "mlb"]', '["caesars", "betmgm"]', 50.00, 'high');

-- Performance optimization views
CREATE VIEW active_users AS
SELECT u.*, p.timezone, p.favorite_sports, p.subscription_tier
FROM users u 
LEFT JOIN user_profiles p ON u.id = p.user_id 
WHERE u.is_active = TRUE;

CREATE VIEW user_betting_stats AS
SELECT 
    u.id,
    u.email,
    u.name,
    COUNT(bh.id) as total_bets,
    SUM(bh.total_amount) as total_wagered,
    SUM(CASE WHEN bh.actual_result = 'win' THEN bh.actual_payout ELSE 0 END) as total_winnings,
    AVG(bh.confidence_score) as avg_confidence
FROM users u
LEFT JOIN betting_history bh ON u.id = bh.user_id
WHERE u.is_active = TRUE
GROUP BY u.id, u.email, u.name;

-- Database comments for documentation
COMMENT ON TABLE users IS 'Core user authentication and account information';
COMMENT ON TABLE user_profiles IS 'Extended user preferences and settings';
COMMENT ON TABLE betting_history IS 'Track user betting history and AI evaluations';
COMMENT ON TABLE user_sessions IS 'JWT token and session management';
COMMENT ON TABLE parlays IS 'Store and track parlay bets independently';

COMMENT ON COLUMN users.subscription_tier IS 'User subscription level: free, premium, pro, admin';
COMMENT ON COLUMN user_profiles.favorite_sports IS 'JSON array of preferred sports codes';
COMMENT ON COLUMN user_profiles.preferred_sportsbooks IS 'JSON array of preferred sportsbook names';
COMMENT ON COLUMN betting_history.parlay_data IS 'Original parlay submission data as JSON';
COMMENT ON COLUMN betting_history.ai_evaluation IS 'AI evaluation results as JSON';
COMMENT ON COLUMN user_sessions.token_hash IS 'SHA256 hash of refresh token for security';
COMMENT ON COLUMN parlays.parlay_id IS 'UUID identifier for parlay tracking';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO smartbets_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO smartbets_app;