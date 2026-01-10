# Database Management Scripts

This directory contains scripts for managing the Racing Analytics Dashboard database.

## Quick Start

```bash
# Reset database (with confirmation prompt)
npm run db:reset

# Reset database with test data
npm run db:reset:seed

# Reset database without confirmation (dangerous!)
npm run db:reset:force
```

## Available Scripts

### TypeScript Script (Recommended)
- **File:** `reset-database.ts`
- **Usage:** `npm run reset-db [--seed] [--confirm]`
- **Features:** Full error handling, interactive prompts, test data seeding

### Shell Script (Alternative)
- **File:** `reset-database.sh`
- **Usage:** `./reset-database.sh [--seed] [--confirm]`
- **Features:** Direct SQL execution, cross-platform compatibility

## Documentation

See [docs/database-reset-script.md](../docs/database-reset-script.md) for complete documentation.

## ⚠️ Warning

These scripts will **PERMANENTLY DELETE** all data in your database. Use with caution!