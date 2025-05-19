import logging
import resend
from ..core.config import settings
from ..email_templates.invite_code_email import get_invite_code_email_html, get_invite_code_email_text

logger = logging.getLogger(__name__)

def send_email_with_resend(to_email, subject, html_content=None, text_content=None, from_email=None):
    """
    Send an email using Resend API through the official Python SDK
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML content of the email
        text_content: Plain text content of the email (optional)
        from_email: Sender email address (optional, defaults to a Resend address)
    
    Returns:
        dict: Response from Resend API
    """
    if not settings.RESEND_API_KEY:
        logger.error("Resend API key is not configured.")
        return {"error": "Resend API key is not configured"}
    
    # Configure Resend SDK
    resend.api_key = settings.RESEND_API_KEY
    
    # If from_email is not provided, use the verified domain
    if not from_email:
        from_email = "COSMOS Invites <no-reply@invite.devosmic.com>"
    
    # Build payload
    params = {
        "from": from_email,
        "to": [to_email],  # SDK expects a list of recipients
        "subject": subject,
    }
    
    # Add HTML content if provided
    if html_content:
        params["html"] = html_content
    
    # Add text content if provided
    if text_content:
        params["text"] = text_content
    
    # Send request using Resend SDK
    try:
        response = resend.Emails.send(params)
        logger.info(f"Email sent successfully to {to_email}")
        return response
    except Exception as e:
        logger.exception(f"Failed to send email: {str(e)}")
        return {"error": str(e)}

async def send_invite_code_email(to_email, invite_code, expires_at, redemption_count=0):
    """
    Send an email with invite code details
    
    Args:
        to_email: Recipient email address
        invite_code: The invite code
        expires_at: Expiry date of the invite code
        redemption_count: Current number of redemptions (default: 0)
    
    Returns:
        dict: Response from Resend API
    """
    # Get email content
    subject = "Your COSMOS Invitation Code"
    html_content = get_invite_code_email_html(
        invite_code=invite_code,
        email=to_email,
        expires_at=expires_at,
        redemption_count=redemption_count
    )
    text_content = get_invite_code_email_text(
        invite_code=invite_code,
        email=to_email,
        expires_at=expires_at,
        redemption_count=redemption_count
    )
    
    # Send the email
    return send_email_with_resend(
        to_email=to_email,
        subject=subject,
        html_content=html_content,
        text_content=text_content
    ) 