from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Dict, Any
import logging

from ..models.gmail import (
    EmailQueryRequest,
    EmailReplyRequest,
    EmailSendRequest,
    EmailListResponse,
    EmailDetailResponse,
    EmailClassificationResponse,
    EmailSummaryResponse,
    EmailReplyResponse,
    EmailSendResponse,
    GmailAuthUrlResponse,
    EmailModifyResponse
)
# Use the shared connector dependency
from ..dependencies import get_cosmos_connector, verify_beta_access
from ..services.cosmos_connector import CosmosConnector

logger = logging.getLogger(__name__)
router = APIRouter()

# Dependency to ensure Gmail agent is available before accessing related endpoints
async def get_gmail_cosmos_connector(
    cosmos: CosmosConnector = Depends(get_cosmos_connector),
    _: bool = Depends(verify_beta_access)
) -> CosmosConnector:
    if not cosmos.has_gmail:
        logger.warning("Attempted to access Gmail endpoint, but Gmail agent is not available.")
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Gmail functionality is not available or not configured correctly"
        )
    return cosmos

@router.get("/auth/url", 
            response_model=GmailAuthUrlResponse,
            summary="Get Gmail OAuth Authorization URL", 
            status_code=status.HTTP_200_OK)
async def get_gmail_auth_url(
    connector: CosmosConnector = Depends(get_cosmos_connector),
    _: bool = Depends(verify_beta_access)
):
    """
    Generates and returns the URL for the user to authorize the application 
    to access their Gmail account.
    """
    # Connector returns { "auth_url": "..." }
    auth_info = await connector.gmail_auth_url()
    return auth_info

@router.get("/auth/callback")
async def auth_callback(
    code: str = Query(..., description="OAuth authorization code"),
    # Use the specialized dependency
    cosmos: CosmosConnector = Depends(get_gmail_cosmos_connector)
) -> Dict[str, Any]:
    """
    Handle the OAuth callback from Gmail authorization.
    """
    try:
        result = await cosmos.gmail_auth_callback(code)
        return result
    except HTTPException as he:
        raise he # Re-raise connector's exception
    except Exception as e:
        logger.exception("API Error handling Gmail auth callback")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error during auth callback: {str(e)}")

@router.post("/emails", response_model=EmailListResponse)
async def fetch_emails(
    request: EmailQueryRequest,
    # Use the specialized dependency
    cosmos: CosmosConnector = Depends(get_gmail_cosmos_connector)
) -> Dict[str, Any]:
    """
    Fetch emails from Gmail based on a search query.
    """
    try:
        result = await cosmos.fetch_emails(request.query, request.max_results)
        # The connector returns the correct structure for EmailListResponse
        # but we could add checks here if needed.
        # if not result.get("success"):
        #     raise HTTPException(...)
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.exception(f"API Error fetching emails with query '{request.query}'")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error fetching emails: {str(e)}")

@router.get("/emails/{email_id}", response_model=EmailDetailResponse)
async def get_email(
    email_id: str,
    # Use the specialized dependency
    cosmos: CosmosConnector = Depends(get_gmail_cosmos_connector)
) -> Dict[str, Any]:
    """
    Get details of a specific email.
    """
    try:
        # Connector returns { "success": True, "details": { ... } } 
        result = await cosmos.get_email_details(email_id)
        
        email_details = result.get("details") 
        if email_details is None:
             # Defensive check if 'details' key is missing unexpectedly.
             logger.error(f"Connector returned success but no details for email {email_id}")
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve email details structure.")
             
        # Construct the response to match EmailDetailResponse model
        return {
            "success": True,
            "email": email_details,
            "message": None # Explicitly add message as None for successful response
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.exception(f"API Error getting details for email {email_id}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error retrieving email: {str(e)}")

@router.post("/emails/{email_id}/classify", response_model=EmailClassificationResponse)
async def classify_email(
    email_id: str,
    # Use the specialized dependency
    cosmos: CosmosConnector = Depends(get_gmail_cosmos_connector)
) -> Dict[str, Any]:
    """
    Classify an email.
    """
    try:
        result = await cosmos.classify_email(email_id)
        # Check for success if necessary, though connector raises exceptions on failure
        # if not result.get("success"):
        #      raise HTTPException(...)
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.exception(f"API Error classifying email {email_id}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error classifying email: {str(e)}")

@router.post("/emails/{email_id}/summarize", response_model=EmailSummaryResponse)
async def summarize_email(
    email_id: str,
    # Use the specialized dependency
    cosmos: CosmosConnector = Depends(get_gmail_cosmos_connector)
) -> Dict[str, Any]:
    """
    Generate a summary of an email.
    """
    try:
        # Connector returns { "success": True, "summary": "..." } or raises
        result = await cosmos.summarize_email(email_id)
        
        # Explicitly construct response matching EmailSummaryResponse
        return {
            "success": result.get("success", False), 
            "summary": result.get("summary"),
            "message": result.get("message") # Include message if connector provided one
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.exception(f"API Error summarizing email {email_id}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error summarizing email: {str(e)}")

@router.post("/emails/{email_id}/reply", response_model=EmailReplyResponse)
async def generate_reply(
    email_id: str,
    request: EmailReplyRequest,
    # Use the specialized dependency
    cosmos: CosmosConnector = Depends(get_gmail_cosmos_connector)
) -> Dict[str, Any]:
    """
    Generate a reply to an email.
    """
    try:
        # Connector returns { "success": True, "reply": "..." } or raises
        result = await cosmos.generate_email_reply(
            email_id=email_id,
            tone=request.tone,
            style=request.style,
            length=request.length,
            context=request.context or ""
        )
        
        # Explicitly construct response matching EmailReplyResponse
        return {
            "success": result.get("success", False),
            "reply": result.get("reply"),
            "message": result.get("message")
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.exception(f"API Error generating reply for email {email_id}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error generating reply: {str(e)}")

@router.post("/emails/{email_id}/send", response_model=EmailSendResponse)
async def send_reply(
    email_id: str,
    request: EmailSendRequest,
    # Use the specialized dependency
    cosmos: CosmosConnector = Depends(get_gmail_cosmos_connector)
) -> Dict[str, Any]:
    """
    Send a reply to an email and mark the original as read.
    """
    send_success_response = {}
    try:
        # 1. Send the reply
        # Connector returns { "success": True, "sent_message_id": "..." } or raises
        send_result = await cosmos.send_email_reply(email_id, request.reply_text)
        
        # Prepare the success response for sending
        send_success_response = {
            "success": send_result.get("success", False),
            "sent_message_id": send_result.get("sent_message_id"),
            "message": send_result.get("message") 
        }

        # 2. If sending was successful, attempt to mark original as read
        if send_success_response["success"]:
            try:
                logger.info(f"Reply sent for {email_id}, attempting to mark as read.")
                await cosmos.mark_email_read(email_id)
                # Log success, but the primary response is about sending
                logger.info(f"Successfully marked original email {email_id} as read after sending reply.")
            except Exception as mark_read_error:
                # Log the error but don't fail the overall operation, 
                # as the primary goal (sending) succeeded.
                logger.error(f"Failed to mark email {email_id} as read after sending reply: {mark_read_error}", exc_info=True)
                # Optionally add a note to the response message?
                # send_success_response["message"] = (send_success_response.get("message") or "Reply sent") + " (failed to mark original as read)."

        # Return the result of the send operation
        return send_success_response

    except HTTPException as he:
        # Handle errors from send_email_reply or mark_email_read if they raise HTTPException
        raise he
    except Exception as e:
        # Handle unexpected errors during the send process
        logger.exception(f"API Error sending reply for email {email_id}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error sending reply: {str(e)}")

@router.patch("/emails/{email_id}/read", response_model=EmailModifyResponse)
async def mark_as_read(
    email_id: str,
    cosmos: CosmosConnector = Depends(get_gmail_cosmos_connector)
) -> Dict[str, Any]:
    """
    Mark a specific email as read (removes the UNREAD label).
    """
    try:
        # Connector returns { "success": True, "message": "..." } or raises
        result = await cosmos.mark_email_read(email_id)
        # Explicitly construct response matching EmailModifyResponse
        return {
            "success": result.get("success", False),
            "message": result.get("message")
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.exception(f"API Error marking email {email_id} as read")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error marking email as read: {str(e)}") 