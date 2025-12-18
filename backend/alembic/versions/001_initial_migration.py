"""Initial migration - create users and vocabulary tables

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('username', sa.String(100), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Create vocabulary table
    op.create_table(
        'vocabulary',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('expression', sa.String(255), nullable=False),
        sa.Column('reading', sa.String(255), nullable=False),
        sa.Column('meaning', sa.String(1000), nullable=False),
        sa.Column('tags', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vocabulary_expression'), 'vocabulary', ['expression'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_vocabulary_expression'), table_name='vocabulary')
    op.drop_table('vocabulary')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_table('users')

