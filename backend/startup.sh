#!/bin/sh
set -e

echo "Checking database migration status..."

# Check if alembic_version table exists
ALEMBIC_EXISTS=$(python -c "
from sqlalchemy import create_engine, text
import os
engine = create_engine(os.environ['DATABASE_URL'])
with engine.connect() as conn:
    result = conn.execute(text(\"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'alembic_version')\"))
    print('true' if result.scalar() else 'false')
")

# Check if users table exists (meaning DB was created before alembic was used)
USERS_EXISTS=$(python -c "
from sqlalchemy import create_engine, text
import os
engine = create_engine(os.environ['DATABASE_URL'])
with engine.connect() as conn:
    result = conn.execute(text(\"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')\"))
    print('true' if result.scalar() else 'false')
")

echo "Alembic version table exists: $ALEMBIC_EXISTS"
echo "Users table exists: $USERS_EXISTS"

# If users table exists but alembic doesn't, stamp to 001
if [ "$USERS_EXISTS" = "true" ] && [ "$ALEMBIC_EXISTS" = "false" ]; then
    echo "Database exists without alembic tracking. Stamping to migration 001..."
    alembic stamp 001
fi

# Run migrations
echo "Running database migrations..."
alembic upgrade head

echo "Starting server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

