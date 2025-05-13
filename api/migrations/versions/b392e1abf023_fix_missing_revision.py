"""Fix missing revision

Revision ID: b392e1abf023
Revises: b32f45c9a123
Create Date: 2023-08-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b392e1abf023'
down_revision = 'b32f45c9a123'
branch_labels = None
depends_on = None


def upgrade():
    # This is an empty migration to align with the database state
    pass


def downgrade():
    # This is an empty migration to align with the database state
    pass 