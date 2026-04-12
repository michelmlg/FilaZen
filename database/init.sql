-- FilaZen Database Init
-- This script runs only on first container startup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'America/Sao_Paulo';
