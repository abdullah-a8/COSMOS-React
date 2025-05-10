"""Create authentication tables

Revision ID: aef23c0bd791
Revises: 
Create Date: 2025-05-10 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'aef23c0bd791'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create pgcrypto extension if not exists
    op.execute('CREATE EXTENSION IF NOT EXISTS pgcrypto')
    
    # Create invite_codes table
    op.create_table('invite_codes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code_hash', sa.Text(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('redemption_count', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('max_redemptions', sa.Integer(), server_default=sa.text('1'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create sessions table
    op.create_table('sessions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_identifier', sa.String(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.TIMESTAMP(), nullable=False),
        sa.Column('session_metadata', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('idx_invite_codes_email'), 'invite_codes', ['email'], unique=False)
    op.create_index(op.f('idx_invite_codes_expiry'), 'invite_codes', ['expires_at'], unique=False, 
                    postgresql_where=sa.text('expires_at IS NOT NULL'))
    op.create_index(op.f('idx_sessions_user_identifier'), 'sessions', ['user_identifier'], unique=False)
    op.create_index(op.f('idx_sessions_expiry'), 'sessions', ['expires_at'], unique=False)


def downgrade():
    # Drop tables and indexes
    op.drop_index(op.f('idx_sessions_expiry'), table_name='sessions')
    op.drop_index(op.f('idx_sessions_user_identifier'), table_name='sessions')
    op.drop_index(op.f('idx_invite_codes_expiry'), table_name='invite_codes')
    op.drop_index(op.f('idx_invite_codes_email'), table_name='invite_codes')
    op.drop_table('sessions')
    op.drop_table('invite_codes')