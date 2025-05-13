"""Add users table

Revision ID: b32f45c9a123
Revises: aef23c0bd791
Create Date: 2025-05-25 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'b32f45c9a123'
down_revision = 'aef23c0bd791'
branch_labels = None
depends_on = None


def upgrade():
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('display_name', sa.String(), nullable=True),
        sa.Column('access_key', sa.String(), nullable=False),
        sa.Column('password_hash', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('last_login', sa.TIMESTAMP(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('invite_code_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['invite_code_id'], ['invite_codes.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('access_key'),
        sa.UniqueConstraint('email')
    )
    
    # Add unique constraint on email in the invite_codes table
    op.create_unique_constraint('uq_invite_codes_email', 'invite_codes', ['email'])
    
    # Create indexes
    op.create_index(op.f('idx_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('idx_users_access_key'), 'users', ['access_key'], unique=True)


def downgrade():
    # Drop indexes and constraints
    op.drop_index(op.f('idx_users_access_key'), table_name='users')
    op.drop_index(op.f('idx_users_email'), table_name='users')
    op.drop_constraint('uq_invite_codes_email', 'invite_codes', type_='unique')
    
    # Drop users table
    op.drop_table('users') 