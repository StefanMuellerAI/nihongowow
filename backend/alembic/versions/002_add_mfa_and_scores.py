"""Add MFA codes, daily highscores and extend users table

Revision ID: 002
Revises: 001
Create Date: 2024-12-14 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Extend users table with email and MFA fields
    op.add_column('users', sa.Column('email', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('is_email_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('mfa_enabled', sa.Boolean(), nullable=False, server_default='true'))
    
    # Create unique index on email (after making it required via data migration if needed)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Create MFA codes table
    op.create_table(
        'mfa_codes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(6), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_mfa_codes_user_id'), 'mfa_codes', ['user_id'], unique=False)

    # Create daily highscores table
    op.create_table(
        'daily_highscores',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('game_type', sa.String(20), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'game_type', 'date', name='uix_user_game_date')
    )
    op.create_index(op.f('ix_daily_highscores_user_id'), 'daily_highscores', ['user_id'], unique=False)

    # Create settings table if not exists
    op.create_table(
        'settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('key', sa.String(100), nullable=False),
        sa.Column('value', sa.String(500), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_settings_key'), 'settings', ['key'], unique=True)


def downgrade() -> None:
    # Drop settings table
    op.drop_index(op.f('ix_settings_key'), table_name='settings')
    op.drop_table('settings')

    # Drop daily highscores table
    op.drop_index(op.f('ix_daily_highscores_user_id'), table_name='daily_highscores')
    op.drop_table('daily_highscores')

    # Drop MFA codes table
    op.drop_index(op.f('ix_mfa_codes_user_id'), table_name='mfa_codes')
    op.drop_table('mfa_codes')

    # Remove added columns from users
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_column('users', 'mfa_enabled')
    op.drop_column('users', 'is_email_verified')
    op.drop_column('users', 'email')

