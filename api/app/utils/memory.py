from typing import List, Optional, Any
import logging
import json
import uuid
import traceback
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_postgres import PostgresChatMessageHistory
import psycopg

# Get memory window from config
from ..core.config import settings
from ..db.session import get_db_connection_string

logger = logging.getLogger(__name__)

class ChatMemoryManager:
    """
    Manages chat message history in PostgreSQL database using LangChain's PostgresChatMessageHistory.
    
    This implementation is:
    1. Error-tolerant: Falls back gracefully if DB operations fail
    2. Fast: Reuses existing DB connections
    3. Configurable: Respects MEMORY_WINDOW from settings
    """
    
    @staticmethod
    async def ensure_table_exists():
        """
        Ensures the chat_message_history table exists in the database.
        This should be called during application startup.
        """
        connection = None
        try:
            connection_string = get_db_connection_string()
            
            # Use a temporary connection to create the table
            connection = psycopg.connect(connection_string)
            
            # Create the table using the PostgresChatMessageHistory helper
            PostgresChatMessageHistory.create_tables(connection, "chat_message_history")
            
            logger.info("Chat message history table created or verified")
            return True
        except Exception as e:
            logger.error(f"Error ensuring chat message history table exists: {str(e)}")
            logger.error(traceback.format_exc())
            return False
        finally:
            if connection:
                try:
                    connection.close()
                    logger.debug("Database connection closed successfully")
                except Exception as e:
                    logger.error(f"Error closing database connection: {str(e)}")
    
    @staticmethod
    async def get_memory(db: AsyncSession, session_id: str) -> List[BaseMessage]:
        """
        Gets chat history messages from PostgreSQL for a session.
        
        Args:
            db: SQLAlchemy AsyncSession connection
            session_id: Unique identifier for the chat session
            
        Returns:
            List of BaseMessage objects representing the chat history, processed for optimal context
        """
        if not session_id:
            logger.debug("No session_id provided, returning empty chat history")
            return []
            
        connection = None
        try:
            logger.info(f"Retrieving chat memory for session: {session_id}")
            connection_string = get_db_connection_string()
            
            # Create a new connection for this operation
            connection = psycopg.connect(connection_string)
            
            # Initialize the history object with table_name, session_id, and sync_connection
            history = PostgresChatMessageHistory(
                "chat_message_history",
                session_id,
                sync_connection=connection
            )
            
            # Get all messages to ensure nothing is missing
            all_messages = history.get_messages()
            total_messages = len(all_messages)
            logger.info(f"Retrieved {total_messages} messages from chat history for session: {session_id}")
            
            # Apply memory window based on settings but ensure we capture more context if needed
            memory_window = getattr(settings, "MEMORY_WINDOW", 25)
            
            # Smart context selection: 
            # 1. Always include at least the most recent memory_window messages
            # 2. For older important conversations, include message pairs up to 2*memory_window
            # 3. If total messages <= memory_window, just return all
            if total_messages <= memory_window:
                result = all_messages
            else:
                # Check for topic reset markers in the conversation
                reset_indices = []
                for i, msg in enumerate(all_messages):
                    # Check for system messages that indicate topic resets
                    if msg.type == "system" and hasattr(msg, "additional_kwargs"):
                        kwargs = getattr(msg, "additional_kwargs", {})
                        if kwargs.get("is_topic_reset", False) or "reset" in msg.content.lower():
                            reset_indices.append(i)
                            logger.debug(f"Found topic reset at message {i}: {msg.content}")
                
                # If we found reset markers, use the most recent conversation segment
                if reset_indices and len(reset_indices) > 0:
                    # Get the last reset index
                    last_reset = reset_indices[-1]
                    
                    # Use messages after the last reset, or if there aren't enough, 
                    # use the memory window
                    if last_reset + 1 < total_messages:
                        post_reset_messages = all_messages[last_reset + 1:]
                        if len(post_reset_messages) > memory_window:
                            # If we have a lot of messages after reset, use the last memory_window
                            result = post_reset_messages[-memory_window:]
                        else:
                            # Otherwise use all post-reset messages
                            result = post_reset_messages
                        
                        logger.debug(f"Using {len(result)} messages after topic reset at index {last_reset}")
                    else:
                        # Default to recent context if reset was the last message
                        result = all_messages[-memory_window:]
                else:
                    # Extract recent context (last memory_window messages)
                    recent_context = all_messages[-memory_window:]
                    
                    # For long conversations, analyze the rest to find relevant context
                    if total_messages > memory_window:
                        # Find pairs of human/AI messages that might contain relevant topic information
                        # Scan by pairs (user query + AI response)
                        older_messages = all_messages[:-memory_window]
                        relevant_older_pairs = []
                        
                        # Process message pairs (user + assistant)
                        for i in range(0, len(older_messages) - 1, 2):
                            if i+1 < len(older_messages):
                                if older_messages[i].type == "human" and older_messages[i+1].type == "ai":
                                    relevant_older_pairs.append(older_messages[i])
                                    relevant_older_pairs.append(older_messages[i+1])
                        
                        # Only include up to memory_window older messages to avoid context length issues
                        if relevant_older_pairs:
                            if len(relevant_older_pairs) > memory_window:
                                # If too many, include the most recent pairs
                                relevant_older_pairs = relevant_older_pairs[-memory_window:]
                            
                            result = relevant_older_pairs + recent_context
                        else:
                            result = recent_context
                    else:
                        result = recent_context
            
            if result:
                logger.debug(f"First message in memory context: {result[0].type} - {result[0].content[:50]}...")
                logger.debug(f"Last message in memory context: {result[-1].type} - {result[-1].content[:50]}...")
                logger.debug(f"Using {len(result)} messages for context out of {total_messages} total")
            
            return result
            
        except Exception as e:
            logger.error(f"Error retrieving chat memory: {str(e)}")
            logger.error(traceback.format_exc())
            # Return empty list as fallback
            return []
        finally:
            if connection:
                try:
                    connection.close()
                    logger.debug("Database connection closed successfully")
                except Exception as e:
                    logger.error(f"Error closing database connection: {str(e)}")
    
    @staticmethod
    async def add_messages(db: AsyncSession, session_id: str, 
                          query: str, response: str) -> bool:
        """
        Adds user query and bot response to PostgreSQL chat history.
        
        Args:
            db: SQLAlchemy AsyncSession connection
            session_id: Unique identifier for the chat session
            query: User's question text
            response: AI's response text
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not session_id:
            logger.warning("No session_id provided, skipping message storage")
            return False
            
        connection = None
        try:
            logger.info(f"Adding messages to chat memory for session: {session_id}")
            connection_string = get_db_connection_string()
            
            # Create a new connection for this operation
            connection = psycopg.connect(connection_string)
            
            # Create message objects
            user_message = HumanMessage(content=query)
            ai_message = AIMessage(content=response)
            
            # Initialize the history object with table_name, session_id, and sync_connection
            history = PostgresChatMessageHistory(
                "chat_message_history",
                session_id,
                sync_connection=connection
            )
            
            # Add the messages
            history.add_messages([user_message, ai_message])
            logger.info(f"Successfully added 2 messages to chat memory for session: {session_id}")
            
            return True
        except Exception as e:
            logger.error(f"Error saving chat memory: {str(e)}")
            logger.error(traceback.format_exc())
            return False
        finally:
            if connection:
                try:
                    connection.close()
                    logger.debug("Database connection closed successfully")
                except Exception as e:
                    logger.error(f"Error closing database connection: {str(e)}") 