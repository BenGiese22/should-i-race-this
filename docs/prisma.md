# Prisma Overview

## What Prisma Is
Prisma is a database toolkit for TypeScript/Node.js that provides:
- A schema-driven ORM (via `schema.prisma`).
- Type-safe database access (generated Prisma Client).
- A migration system to evolve your database schema.
- Query tooling and introspection for existing databases.

Prisma centers on a single schema file that defines:
- The data models and relations.
- The datasource (database connection).
- The generator (what Prisma generates).

## Key Concepts
- **Prisma Schema**: Declarative schema in `prisma/schema.prisma` that defines models, relations, and datasource.
- **Prisma Client**: Auto-generated TypeScript client for querying your database.
- **Migrations**: Versioned changes stored in `prisma/migrations` to keep schema and database aligned.
- **Introspection**: Pull an existing database schema into Prisma.

## Frequently Used Commands

### Generate Client
Regenerates Prisma Client after schema changes.

```bash
npx prisma generate
```

### Create and Apply a Migration (Dev)
Creates a migration based on schema changes and applies it to your dev database.

```bash
npx prisma migrate dev --name <migration_name>
```

### Apply Migrations (Prod/CI)
Applies existing migrations to the database without creating new ones.

```bash
npx prisma migrate deploy
```

### Reset Database (Dev)
Drops the database, re-applies migrations, and optionally seeds data.

```bash
npx prisma migrate reset
```

### Pull Schema from Database
Introspects the database and updates `schema.prisma`.

```bash
npx prisma db pull
```

### Push Schema to Database (No Migrations)
Pushes schema changes directly to the database without creating migrations.

```bash
npx prisma db push
```

### Open Prisma Studio
Starts a local UI to browse and edit data.

```bash
npx prisma studio
```

## Tips
- Run `npx prisma generate` after schema updates.
- Prefer migrations (`migrate dev`) for tracked changes.
- Use `db push` for quick prototyping or disposable environments.
