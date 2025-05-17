"""Create chat message history table

Revision ID: a75e2c12f845
Revises: b392e1abf023
Create Date: 2025-05-16

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
import datetime

# revision identifiers, used by Alembic
revision = 'a75e2c12f845'
down_revision = 'b392e1abf023'
branch_labels = None
depends_on = None


def upgrade():
    """Create chat_message_history table for storing conversation history."""
    op.create_table(
        'chat_message_history',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('session_id', sa.String(), nullable=False, index=True),
        sa.Column('message', JSONB(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), 
                 server_default=sa.text('now()'), nullable=False)
    )
    
    # Create index for faster retrievals
    op.create_index('idx_chat_message_history_session_id', 
                   'chat_message_history', ['session_id'])


def downgrade():
    """Drop the chat_message_history table and its index."""
    op.drop_index('idx_chat_message_history_session_id', table_name='chat_message_history')
    op.drop_table('chat_message_history') 