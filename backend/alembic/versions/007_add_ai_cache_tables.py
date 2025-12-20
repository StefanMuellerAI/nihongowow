"""Add AI cache tables for hints and TTS

Revision ID: 007
Revises: 006
Create Date: 2024-12-18

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create vocabulary_hint_cache table
    op.create_table(
        'vocabulary_hint_cache',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('vocabulary_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('vocabulary.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('mode', sa.String(20), nullable=False),
        sa.Column('hint', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('vocabulary_id', 'mode', name='uix_vocab_hint_mode'),
    )

    # Create vocabulary_tts_cache table
    op.create_table(
        'vocabulary_tts_cache',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('text', sa.String(500), unique=True, nullable=False, index=True),
        sa.Column('audio_data', sa.LargeBinary(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('vocabulary_tts_cache')
    op.drop_table('vocabulary_hint_cache')



