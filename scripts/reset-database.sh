#!/bin/bash

# Racing Analytics Dashboard - Database Reset Script
# This script provides a simple way to reset the database using SQL commands

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f "../.env.local" ]; then
    export $(cat ../.env.local | grep -v '^#' | xargs)
elif [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env.local file not found${NC}"
    echo "Make sure you have a .env.local file with DATABASE_URL"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL environment variable is required${NC}"
    exit 1
fi

# Parse command line arguments
SKIP_CONFIRMATION=false
SEED_DATA=false

for arg in "$@"; do
    case $arg in
        --confirm)
            SKIP_CONFIRMATION=true
            shift
            ;;
        --seed)
            SEED_DATA=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --confirm    Skip confirmation prompt"
            echo "  --seed       Add test data after reset"
            echo "  --help       Show this help message"
            exit 0
            ;;
    esac
done

# Confirmation prompt
if [ "$SKIP_CONFIRMATION" = false ]; then
    echo -e "${YELLOW}⚠️  This will PERMANENTLY DELETE all data in your database.${NC}"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo -e "${RED}❌ Database reset cancelled${NC}"
        exit 0
    fi
fi

echo -e "${BLUE}🏁 Racing Analytics Dashboard - Database Reset${NC}"
echo "=================================================="

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

# Function to execute SQL
execute_sql() {
    local sql_command="$1"
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$sql_command"
}

echo -e "${YELLOW}🗑️  Dropping existing tables...${NC}"

# Drop tables in reverse dependency order
execute_sql "DROP TABLE IF EXISTS schedule_entries CASCADE;"
execute_sql "DROP TABLE IF EXISTS race_results CASCADE;"
execute_sql "DROP TABLE IF EXISTS license_classes CASCADE;"
execute_sql "DROP TABLE IF EXISTS iracing_accounts CASCADE;"
execute_sql "DROP TABLE IF EXISTS users CASCADE;"

echo -e "${GREEN}✅ All tables dropped successfully${NC}"

echo -e "${YELLOW}🏗️  Recreating database schema...${NC}"

# Navigate to project root and run migrations
cd ..
npx drizzle-kit push

echo -e "${GREEN}✅ Database schema recreated successfully${NC}"

if [ "$SEED_DATA" = true ]; then
    echo -e "${YELLOW}🌱 Seeding test data...${NC}"
    
    # Generate a test user ID
    TEST_USER_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
    
    # Create test user
    execute_sql "INSERT INTO users (id, iracing_customer_id, display_name, created_at, updated_at) VALUES ('$TEST_USER_ID', 123456, 'Test User', NOW(), NOW());"
    
    # Create test iRacing account
    ACCOUNT_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
    execute_sql "INSERT INTO iracing_accounts (id, user_id, access_token, refresh_token, access_token_expires_at, created_at, updated_at) VALUES ('$ACCOUNT_ID', '$TEST_USER_ID', 'test_access_token', 'test_refresh_token', NOW() + INTERVAL '1 hour', NOW(), NOW());"
    
    # Create test license classes
    for category in "road" "oval" "dirt_road" "dirt_oval"; do
        LICENSE_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
        level="C"
        safety_rating="2.50"
        irating=$((RANDOM % 2000 + 1500))
        
        execute_sql "INSERT INTO license_classes (id, user_id, category, level, safety_rating, irating, updated_at) VALUES ('$LICENSE_ID', '$TEST_USER_ID', '$category', '$level', $safety_rating, $irating, NOW());"
    done
    
    echo -e "${GREEN}✅ Test data seeded successfully${NC}"
    echo -e "${GREEN}   - Created test user with ID: $TEST_USER_ID${NC}"
    echo -e "${GREEN}   - Created 4 license classes${NC}"
fi

echo "=================================================="
echo -e "${GREEN}🎉 Database reset completed successfully!${NC}"

if [ "$SEED_DATA" = true ]; then
    echo ""
    echo "Test data has been added. You can now:"
    echo "1. Start the development server: npm run dev"
    echo "2. Visit http://127.0.0.1:3000"
    echo "3. Use the test user credentials to explore the dashboard"
else
    echo ""
    echo "Database is now clean. You can:"
    echo "1. Start the development server: npm run dev"
    echo "2. Login with your iRacing account"
    echo "3. Sync your race data"
fi