from datetime import datetime

def calculate_days_remaining(expires_at):
    """Calculate days remaining until expiry"""
    if not expires_at:
        return None
    
    now = datetime.now()
    expiry = expires_at if isinstance(expires_at, datetime) else datetime.fromisoformat(str(expires_at).replace('Z', '+00:00'))
    delta = expiry - now
    return max(0, delta.days)

def format_date(date_obj):
    """Format date string for display"""
    if not date_obj:
        return "Never expires"
    
    try:
        if not isinstance(date_obj, datetime):
            date_obj = datetime.fromisoformat(str(date_obj).replace('Z', '+00:00'))
        return date_obj.strftime("%B %d, %Y")
    except (ValueError, TypeError):
        return str(date_obj)

def get_invite_code_email_html(invite_code, email, max_redemptions, expires_at, redemption_count=0):
    """Generate HTML for invite code email"""
    days_remaining = calculate_days_remaining(expires_at)
    formatted_expiry = format_date(expires_at)
    uses_left = max(0, max_redemptions - redemption_count) if max_redemptions > 0 else "Unlimited"
    expiry_text = f"Expires on {formatted_expiry}" if expires_at else "Never expires"
    
    # Purple theme colors matching the COSMOS app
    primary_color = "#9d4edd"
    primary_dark = "#7b2cbf"
    primary_light = "#c77dff"
    days_color = "#dc2626" if days_remaining and days_remaining < 3 else "#f59e0b" if days_remaining and days_remaining < 7 else "#374151"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your COSMOS Invitation</title>
    </head>
    <body style="
        background-color: #f6f9fc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: #374151;
        padding: 48px 20px;
        margin: 0;
    ">
        <div style="
            background-color: #ffffff;
            border: 1px solid #f0f0f0;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            margin: 0 auto;
            margin-bottom: 64px;
            max-width: 550px;
            padding: 40px;
        ">
            <!-- Logo and Header -->
            <div style="text-align: center; margin-bottom: 32px;">
                <img src="https://cosmos.devosmic.com/cosmos_app.png" alt="COSMOS Logo" width="80" height="80" style="margin-bottom: 20px; display: inline-block;">
                <h1 style="
                    color: {primary_dark};
                    font-size: 28px;
                    font-weight: 700;
                    margin: 0 0 8px;
                ">
                    COSMOS
                </h1>
                <p style="
                    color: #6b7280;
                    font-size: 15px;
                    margin: 0;
                ">
                    Collaborative Organized System for Multiple Operating Specialists
                </p>
            </div>
            
            <h2 style="
                color: #111827;
                font-size: 22px;
                font-weight: 600;
                margin: 32px 0 16px;
            ">
                Your Invitation Code
            </h2>
            
            <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px;">
                You've been invited to join COSMOS. Please use the following code to access the platform:
            </p>
            
            <div style="
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                margin: 24px 0;
                padding: 24px;
                text-align: center;
            ">
                <p style="
                    color: {primary_dark};
                    font-family: 'Courier New', monospace;
                    font-size: 26px;
                    font-weight: 700;
                    margin: 0;
                ">
                    {invite_code}
                </p>
            </div>
            
            <!-- Sign In Button -->
            <div style="text-align: center; margin: 32px 0;">
                <a href="https://cosmos.devosmic.com" style="
                    display: inline-block;
                    padding: 14px 32px;
                    background-color: {primary_dark};
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                    text-decoration: none;
                    text-align: center;
                    border-radius: 8px;
                ">
                    Sign In to COSMOS
                </a>
            </div>
            
            <h3 style="
                color: #111827;
                font-size: 18px;
                font-weight: 600;
                margin: 32px 0 16px;
            ">
                Invitation Details
            </h3>
            
            <div style="
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 24px;
            ">
                <p style="margin: 0 0 12px; color: #4b5563;">
                    <span style="font-weight: 600; color: #374151;">Email:</span> {email or "Not specified"}
                </p>
                
                <p style="margin: 0 0 12px; color: #4b5563;">
                    <span style="font-weight: 600; color: #374151;">Allowed Uses:</span> {max_redemptions if max_redemptions > 0 else "Unlimited"}
                </p>
                
                <p style="margin: 0 0 12px; color: #4b5563;">
                    <span style="font-weight: 600; color: #374151;">Expiry:</span> {formatted_expiry if expires_at else "Never expires"}
                </p>
                
                {f'''
                <p style="
                    margin: 0;
                    color: {days_color};
                    font-weight: 500;
                ">
                    <span style="font-weight: 600;">Days Remaining:</span> {days_remaining}
                </p>
                ''' if days_remaining is not None else ''}
            </div>
            
            <hr style="
                border: none;
                border-top: 1px solid #e5e7eb;
                margin: 32px 0;
            ">
            
            <p style="
                color: #6b7280;
                font-size: 13px;
                margin: 0;
                text-align: center;
                line-height: 1.5;
            ">
                If you did not request this invitation, please disregard this email.
            </p>
            
            <p style="
                color: #9ca3af;
                font-size: 13px;
                margin: 12px 0 0;
                text-align: center;
            ">
                &copy; 2025 COSMOS. All rights reserved.
            </p>
        </div>
    </body>
    </html>
    """
    
    return html

def get_invite_code_email_text(invite_code, email, max_redemptions, expires_at, redemption_count=0):
    """Generate plain text for invite code email"""
    days_remaining = calculate_days_remaining(expires_at)
    formatted_expiry = format_date(expires_at)
    uses_left = max(0, max_redemptions - redemption_count) if max_redemptions > 0 else "Unlimited"
    expiry_text = f"Expires on {formatted_expiry}" if expires_at else "Never expires"
    
    text = f"""
Your COSMOS Invitation

You have been invited to join COSMOS. Use the following code to access the platform:

{invite_code}

Invitation Details:
• Email: {email or "Not specified"}
• Allowed Uses: {max_redemptions if max_redemptions > 0 else "Unlimited"}
• Uses Remaining: {uses_left}
• {expiry_text}
"""
    
    if days_remaining is not None:
        text += f"• Days Remaining: {days_remaining}\n"
    
    text += """
If you did not request this invitation, please disregard this email.
"""
    
    return text 