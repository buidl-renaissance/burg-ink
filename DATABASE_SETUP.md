# Database Setup Guide

This project supports both local SQLite and remote Turso databases based on environment configuration.

## Local Development (SQLite)

To use a local SQLite database for development, create a `.env.local` file with:

```bash
# Use local SQLite database
DATABASE_URL=file:./db.sqlite

# Other required environment variables...
DO_SPACES_ENDPOINT=your_spaces_endpoint
DO_SPACES_BUCKET=your_bucket_name
DO_SPACES_ACCESS_KEY=your_access_key
DO_SPACES_SECRET_KEY=your_secret_key
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Production (Turso)

To use remote Turso database, create a `.env.local` file with:

```bash
# Use remote Turso database (don't set DATABASE_URL or set it to contain 'turso')
TURSO_DATABASE_URL=your_turso_url_here
TURSO_AUTH_TOKEN=your_turso_token_here

# Other required environment variables...
DO_SPACES_ENDPOINT=your_spaces_endpoint
DO_SPACES_BUCKET=your_bucket_name
DO_SPACES_ACCESS_KEY=your_access_key
DO_SPACES_SECRET_KEY=your_secret_key
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Configuration Logic

The application automatically detects which database to use based on the `DATABASE_URL` environment variable:

- If `DATABASE_URL` is set and does NOT contain 'turso' → Uses local SQLite
- If `DATABASE_URL` is not set OR contains 'turso' → Uses remote Turso

## Commands

### Generate Migrations
```bash
yarn db:generate
```

### Apply Migrations
```bash
# Apply migrations to current database (Turso or local based on DATABASE_URL)
yarn db:migrate

# Apply migrations specifically to local SQLite
yarn db:migrate:local
```

### Open Database Studio
```bash
# Open studio for current database (Turso or local based on DATABASE_URL)
yarn db:studio

# Open studio specifically for local SQLite
yarn db:studio:local
```

### Development Server
```bash
# Start dev server with current database configuration
yarn dev

# Start dev server specifically with local SQLite
yarn dev:local
```

## Migration Notes

When using local SQLite, you may need to apply migrations to set up the database schema:

1. Ensure your `.env.local` has `DATABASE_URL=file:./db.sqlite`
2. Run `yarn db:migrate` to apply existing migrations
3. If you encounter migration conflicts, you may need to reset the local database

## Troubleshooting

If you encounter migration errors:
1. Delete `db.sqlite` file
2. Run `yarn db:migrate` to create a fresh database
3. Test upload functionality

The local SQLite database will be created automatically when you first run the application.
