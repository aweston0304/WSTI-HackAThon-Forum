-- psql -U postgres -d dashboard_db

-- 1. ROLES (Independent)
-- Stores the types of users (Mentor, Participant, Admin)
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    permission_level INT DEFAULT 1 -- Higher numbers for more access
);

-- 2. TEAMS (Independent)
-- Stores the hackathon groups
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name VARCHAR(255) NOT NULL,
    project_name VARCHAR(255),
);

-- 3. USERS (Independent-ish)
-- Stores the people. team_id is nullable so Mentors/Admins can exist without a team.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role_id INT REFERENCES roles(id) ON DELETE RESTRICT,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PROGRESS (Dependent)
-- Stores the historical timeline of team updates
CREATE TABLE progress (
    id SERIAL PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    percentage INT NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    status_label VARCHAR(100), -- e.g., 'MVP', 'Deployment'
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. HELP_REQUESTS (Dependent)
-- Stores the SOS tickets sent by teams
CREATE TABLE help_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Track which student asked
    type_of_help VARCHAR(100), -- e.g., 'React', 'Database', 'API'
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'claimed', 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. MENTOR_ASSIGNMENTS (Join Table / Dependent)
-- Handles the Many-to-Many relationship between Mentors and Requests
CREATE TABLE mentor_assignments (
    help_request_id UUID REFERENCES help_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (help_request_id, user_id)
);