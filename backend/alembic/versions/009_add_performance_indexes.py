"""add performance indexes

Revision ID: 009
Revises: 008
Create Date: 2024-12-19

This migration adds indexes for better query performance:
1. Composite index on daily_highscores for common query patterns
2. Index on vocabulary_hint_cache for (vocabulary_id, mode) lookups
3. Index on vocabulary.tags for faster filtering
4. Index on vocabulary.created_at for pagination
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Index for daily highscore queries by game_type and date (leaderboard queries)
    op.create_index(
        'ix_daily_highscores_game_date',
        'daily_highscores',
        ['game_type', 'date', 'score'],
        unique=False
    )
    
    # Composite index on vocabulary_hint_cache for faster lookups
    # The unique constraint already creates an index, but let's ensure it's optimized
    op.create_index(
        'ix_vocabulary_hint_cache_vocab_mode',
        'vocabulary_hint_cache',
        ['vocabulary_id', 'mode'],
        unique=False
    )
    
    # Index on vocabulary for tag filtering
    # Note: For full-text search on tags, consider using PostgreSQL pg_trgm extension
    # This is a standard B-tree index which helps with prefix matching
    op.create_index(
        'ix_vocabulary_tags',
        'vocabulary',
        ['tags'],
        unique=False
    )
    
    # Index on vocabulary for sorting by created_at (used in pagination)
    op.create_index(
        'ix_vocabulary_created_at',
        'vocabulary',
        ['created_at'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index('ix_vocabulary_created_at', table_name='vocabulary')
    op.drop_index('ix_vocabulary_tags', table_name='vocabulary')
    op.drop_index('ix_vocabulary_hint_cache_vocab_mode', table_name='vocabulary_hint_cache')
    op.drop_index('ix_daily_highscores_game_date', table_name='daily_highscores')
