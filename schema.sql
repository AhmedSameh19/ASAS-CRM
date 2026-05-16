-- Users table (simple, can be hardcoded in code or seeded)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prospects table
CREATE TABLE prospects (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    source VARCHAR(100),
    status VARCHAR(100) DEFAULT 'New Lead',
    estimated_value DECIMAL(10, 2),
    expected_close_date DATE,
    priority VARCHAR(20) DEFAULT 'Medium',
    assigned_to INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities table
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    prospect_id INTEGER NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    activity_date TIMESTAMP NOT NULL,
    duration INTEGER,
    notes TEXT,
    outcome TEXT,
    next_steps TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    prospect_id INTEGER NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_key VARCHAR(500) NOT NULL, -- R2 object key
    file_size INTEGER, -- in bytes
    document_type VARCHAR(100),
    description TEXT,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_prospects_status ON prospects(status);
CREATE INDEX idx_prospects_assigned_to ON prospects(assigned_to);
CREATE INDEX idx_prospects_created_at ON prospects(created_at);
CREATE INDEX idx_activities_prospect_id ON activities(prospect_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);
CREATE INDEX idx_documents_prospect_id ON documents(prospect_id);

-- Trigger to auto-update updated_at on prospects table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
