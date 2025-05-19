"""Remove max_redemptions from invite_codes

Revision ID: aef23c0bd792
Revises: b32f45c9a123
Create Date: 2025-06-15 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'aef23c0bd792'
down_revision = 'a75e2c12f845'
branch_labels = None
depends_on = None


def upgrade():
    # Remove max_redemptions column from invite_codes table
    op.drop_column('invite_codes', 'max_redemptions')


def downgrade():
    # Add max_redemptions column back if needed
    op.add_column('invite_codes', 
        sa.Column('max_redemptions', sa.Integer(), server_default=sa.text('1'), nullable=False)
    ) 