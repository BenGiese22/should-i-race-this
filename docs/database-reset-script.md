# Database Reset Script Documentation

## Overview

The Racing Analytics Dashboard includes database reset scripts to help with development, testing, and troubleshooting. These scripts completely wipe and recreate the database schema, optionally seeding it with test data.

## ⚠️ Important Warning

**These scripts will PERMANENTLY DELETE all data in your database!**

- All user accounts will be removed
- All race history will be lost  
- All authentication tokens will be invalidated
- All analytics data will be wiped

Only use these scripts when you're certain you want to start fresh.

## Available Scripts

### 1. TypeScript Script (Recommended)

**Location:** `scripts/reset-database.ts`

This is the primary reset script written in TypeScript with full error handling and safety checks.

#### Usage

```bash
# Basic reset (prompts for confirmation)
npm run reset-db

# Reset with test data
npm run reset-db --seed

# Reset without confirmation prompt
npm run reset-db --confirm

# Reset with test data, no confirmation
npm run reset-db --seed --confirm
```

#### Features

- ✅ Interactive confirmation prompt (unless `--confirm` flag used)
- ✅ Proper foreign key constraint handling
- ✅ Uses Drizzle migrations for schema recreation
- ✅ Optional test data seeding
- ✅ Comprehensive error handling
- ✅ Colored console output
- ✅ Progress indicators

### 2. Shell Script (Alternative)

**Location:** `scripts/reset-database.sh`

A simpler bash script alternative that uses direct SQL commands.

#### Usage

```bash
# Navigate to scripts directory
cd scripts

# Basic reset
./reset-database.sh

# Reset with test data
./reset-database.sh --seed

# Reset without confirmation
./reset-database.sh --confirm

# Show help
./reset-database.sh --help
```

#### Features

- ✅ Direct SQL execution via psql
- ✅ Interactive confirmation prompt
- ✅ Basic test data seeding
- ✅ Colored output
- ✅ Cross-platform compatibility

## What the Scripts Do

### Step 1: Drop All Tables

The scripts drop all existing tables in the correct order to respect foreign key constraints:

1. `schedule_entries` (no dependencies)
2. `race_results` (depends on users)
3. `license_classes` (depends on users)
4. `iracing_accounts` (depends on users)
5. `users` (base table)

### Step 2: Recreate Schema

- **TypeScript version:** Uses `npx drizzle-kit push` to recreate schema from Drizzle definitions
- **Shell version:** Also uses `npx drizzle-kit push` for consistency

### Step 3: Seed Test Data (Optional)

When using the `--seed` flag, the scripts create:

#### Test User
- **iRacing Customer ID:** 123456
- **Display Name:** "Test User"
- **UUID:** Randomly generated

#### Test iRacing Account
- **Access Token:** "test_access_token" 
- **Refresh Token:** "test_refresh_token"
- **Expires:** 1 hour from creation

#### Test License Classes
- **Categories:** road, oval, dirt_road, dirt_oval
- **Level:** Random (D, C, B, A)
- **Safety Rating:** Random (1.00-4.00)
- **iRating:** Random (1000-4000)

#### Test Race Results (TypeScript only)
- **Count:** 20 race results
- **Series:** Skip Barber, Mazda MX-5, Porsche Cup
- **Tracks:** Watkins Glen, Road Atlanta, Sebring
- **Positions:** Random starting/finishing positions (1-20)
- **Incidents:** Random (0-7)
- **Dates:** Random within last 3 months

## Prerequisites

### Environment Variables

Both scripts require a `.env.local` file in the project root with:

```env
DATABASE_URL=postgresql://username:password@host:port/database
```

### Dependencies

#### For TypeScript Script
- Node.js and npm
- `tsx` package (for TypeScript execution)
- `dotenv` package
- Drizzle Kit CLI

#### For Shell Script
- Bash shell
- `psql` command-line tool
- `uuidgen` command (for generating UUIDs)
- Drizzle Kit CLI

## Installation

### Install Script Dependencies

```bash
# Navigate to scripts directory
cd scripts

# Install TypeScript script dependencies
npm install
```

### Verify Prerequisites

```bash
# Check if psql is available (for shell script)
which psql

# Check if uuidgen is available (for shell script)
which uuidgen

# Check if drizzle-kit is available
npx drizzle-kit --version
```

## Usage Examples

### Development Workflow

```bash
# 1. Reset database with fresh schema
npm run reset-db --confirm

# 2. Start development server
npm run dev

# 3. Login with iRacing account and sync data
```

### Testing Workflow

```bash
# 1. Reset database with test data
npm run reset-db --seed --confirm

# 2. Start development server  
npm run dev

# 3. Explore dashboard with pre-populated data
```

### Troubleshooting Workflow

```bash
# If database is in inconsistent state
npm run reset-db --confirm

# If you need to test with known data
npm run reset-db --seed --confirm
```

## Safety Features

### Confirmation Prompts

Both scripts include interactive confirmation prompts by default:

```
⚠️  This will PERMANENTLY DELETE all data in your database. Are you sure? (yes/no):
```

### Skip Confirmation

Use `--confirm` flag to skip prompts (useful for automation):

```bash
npm run reset-db --confirm
```

### Error Handling

- Scripts validate environment variables before execution
- Database connection is tested before making changes
- Foreign key constraints are properly handled
- Clear error messages are provided for common issues

## Troubleshooting

### Common Issues

#### "DATABASE_URL not found"
- Ensure `.env.local` exists in project root
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`

#### "psql command not found" (Shell script)
- Install PostgreSQL client tools
- On macOS: `brew install postgresql`
- On Ubuntu: `sudo apt-get install postgresql-client`

#### "Permission denied" (Shell script)
- Make script executable: `chmod +x scripts/reset-database.sh`

#### "drizzle-kit not found"
- Install Drizzle Kit: `npm install -g drizzle-kit`
- Or use npx: `npx drizzle-kit push`

### Recovery

If a reset fails partway through:

1. Check the error message for specific issues
2. Manually connect to database and verify state
3. Re-run the script (it's designed to be idempotent)
4. If needed, manually drop remaining tables and re-run

## Integration with Development Workflow

### Package.json Scripts

Add these to your main `package.json`:

```json
{
  "scripts": {
    "reset-db": "cd scripts && npm run reset-db",
    "reset-db:seed": "cd scripts && npm run reset-db:seed",
    "reset-db:force": "cd scripts && npm run reset-db:force"
  }
}
```

### Git Hooks

Consider adding a pre-commit hook to prevent accidental commits of reset scripts:

```bash
# .git/hooks/pre-commit
#!/bin/sh
if git diff --cached --name-only | grep -q "scripts/reset-database"; then
    echo "Warning: You're about to commit database reset scripts"
    echo "Make sure this is intentional"
fi
```

## Security Considerations

### Production Safety

- **Never run these scripts against production databases**
- Scripts are designed for development/testing only
- Consider adding environment checks to prevent production usage

### Credential Security

- Database credentials are loaded from environment variables
- Scripts don't log or expose credentials
- Use strong, unique passwords for database access

### Access Control

- Limit who has access to these scripts
- Consider requiring additional authentication for destructive operations
- Document usage in team procedures

## Maintenance

### Updating Scripts

When database schema changes:

1. Update the table drop order in both scripts
2. Test scripts against new schema
3. Update test data seeding if needed
4. Update this documentation

### Version Control

- Keep scripts in version control
- Tag releases when making significant changes
- Document breaking changes in commit messages

## Related Documentation

- [Database Schema Documentation](./database-schema.md)
- [Development Setup Guide](./development-setup.md)
- [iRacing API Integration](./iracing-data-api.md)
- [OAuth and Authentication](./oauth-and-ingestion.md)