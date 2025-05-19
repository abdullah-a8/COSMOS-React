"""Add terms_accepted to users table

Revision ID: b5a01c47e89f
Revises: a75e2c12f845
Create Date: 2025-05-20 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import expression


# revision identifiers, used by Alembic.
revision = 'b5a01c47e89f'
down_revision = 'a75e2c12f845'
branch_labels = None
depends_on = None


def upgrade():
    # Add terms_accepted column to users table
    op.add_column('users', sa.Column('terms_accepted', sa.Boolean(), server_default=expression.false(), nullable=False))

    # Optional: Create an index for faster querying
    op.create_index(op.f('ix_users_terms_accepted'), 'users', ['terms_accepted'], unique=False)


def downgrade():
    # Drop index
    op.drop_index(op.f('ix_users_terms_accepted'), table_name='users')
    
    # Drop column
    op.drop_column('users', 'terms_accepted') 