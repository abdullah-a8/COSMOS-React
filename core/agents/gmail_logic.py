import os
import json
import base64
import logging
import threading
from typing import Optional, Dict, Any, List, Tuple
import email.utils
import re

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import openai
# Assuming config.prompts is accessible via sys.path added by CosmosConnector
import config.prompts as prompts

# --- Configuration ---
# Determine the project root dynamically
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

CREDENTIALS_DIR_NAME = 'credentials'
CREDENTIALS_DIR = os.path.join(PROJECT_ROOT, CREDENTIALS_DIR_NAME)

TOKEN_FILE = os.path.join(CREDENTIALS_DIR, '.gmail_token.json')
CREDENTIALS_FILE = os.path.join(CREDENTIALS_DIR, '.gmail_credentials.json')
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

# This URI must be listed as an Authorized redirect URI in Google Cloud Console
# for the OAuth 2.0 Client ID used in CREDENTIALS_FILE.
REDIRECT_URI = os.getenv('GMAIL_REDIRECT_URI', 'http://localhost:8090/')

logger = logging.getLogger(__name__)

# --- Globals for Service Caching ---
_gmail_service = None
_service_lock = threading.Lock()

# --- Authentication Functions ---

def _load_credentials_from_token_file() -> Optional[Credentials]:
    """Loads credentials from the token file if it exists."""
    creds = None
    if os.path.exists(TOKEN_FILE):
        try:
            with open(TOKEN_FILE, 'r') as token:
                creds = Credentials.from_authorized_user_info(json.load(token), SCOPES)
            logger.info(f"Loaded credentials from {TOKEN_FILE}")
        except json.JSONDecodeError:
            logger.error(f"Error decoding JSON from {TOKEN_FILE}. Token file might be corrupt.")
            creds = None
        except Exception as e:
            logger.error(f"Error loading token file {TOKEN_FILE}: {e}")
            creds = None
    return creds

def _save_credentials_to_token_file(creds: Credentials):
    """Saves credentials to the token file."""
    try:
        os.makedirs(os.path.dirname(TOKEN_FILE), exist_ok=True)
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
        logger.info(f"Saved credentials to {TOKEN_FILE}")
    except Exception as e:
        logger.error(f"Could not save token file {TOKEN_FILE}: {e}")

def get_authorization_url() -> Tuple[Optional[str], Optional[str]]:
    """Generates the Google OAuth 2.0 authorization URL and state."""
    if not os.path.exists(CREDENTIALS_FILE):
        logger.error(f"Credentials file not found at {CREDENTIALS_FILE}. Cannot start auth flow.")
        # Indicate failure by returning None
        return None, None 

    try:
        flow = InstalledAppFlow.from_client_secrets_file(
            CREDENTIALS_FILE, 
            SCOPES,
            redirect_uri=REDIRECT_URI
        )
        
        # state can be used for CSRF protection
        auth_url, state = flow.authorization_url(
            access_type='offline',  # Request a refresh token
            prompt='consent'        # Force consent screen (good for testing/first auth)
        )
        logger.info("Generated authorization URL.") # Removed URL from log
        return auth_url, state
    
    except FileNotFoundError:
         logger.error(f"Credentials file not found during flow creation: {CREDENTIALS_FILE}")
         return None, None
    except Exception as e:
        logger.error(f"Failed to create authorization flow: {e}", exc_info=True)
        return None, None

def handle_oauth_callback(code: str) -> bool:
    """Handles the OAuth callback, exchanging the code for tokens."""
    if not os.path.exists(CREDENTIALS_FILE):
        logger.error(f"Credentials file not found at {CREDENTIALS_FILE}. Cannot handle callback.")
        return False # Indicate failure

    try:
        flow = InstalledAppFlow.from_client_secrets_file(
            CREDENTIALS_FILE, 
            SCOPES,
            redirect_uri=REDIRECT_URI
        )
        
        flow.fetch_token(code=code)
        creds = flow.credentials
        
        _save_credentials_to_token_file(creds)
        
        # Clear cached service after successful auth to ensure new creds are used
        global _gmail_service
        with _service_lock:
            _gmail_service = None 
            
        logger.info("OAuth callback successful, tokens fetched and saved.")
        return True # Indicate success

    except FileNotFoundError:
         logger.error(f"Credentials file not found during callback handling: {CREDENTIALS_FILE}")
         return False
    except Exception as e:
        logger.error(f"OAuth callback failed: {e}", exc_info=True)
        return False # Indicate failure

def _refresh_credentials(creds: Credentials) -> Optional[Credentials]:
    """Refreshes expired credentials using the refresh token."""
    try:
        creds.refresh(Request())
        logger.info("Credentials refreshed successfully.")
        _save_credentials_to_token_file(creds)
        return creds
    except Exception as e:
        logger.error(f"Error refreshing credentials: {e}. Need re-authentication.")
        # Consider automatically deleting the invalid token file upon refresh failure
        # E.g., if os.path.exists(TOKEN_FILE): try: os.remove(TOKEN_FILE) ...
        return None

def get_gmail_service() -> Optional[Any]:
    """Gets the authenticated Gmail service, using cached service if available/valid."""
    global _gmail_service
    with _service_lock:
        if _gmail_service:
            # Heuristic check if cached credentials might be expired. 
            # Real check happens implicitly on API call (HttpError 401).
            if _gmail_service._http.credentials and _gmail_service._http.credentials.valid:
                 # Removed debug log
                 return _gmail_service
            else:
                 logger.info("Cached service credentials seem invalid/expired. Re-authenticating.")
                 _gmail_service = None

        creds = _load_credentials_from_token_file()

        if not creds:
            logger.warning("No credentials found in token file. Authentication required.")
            return None 

        if not creds.valid:
            if creds.expired and creds.refresh_token:
                logger.info("Credentials expired, attempting refresh...")
                creds = _refresh_credentials(creds)
                if not creds:
                    logger.error("Credential refresh failed. User needs to re-authorize.")
                    return None 
            else:
                logger.error("Credentials invalid and cannot be refreshed. User needs to re-authorize.")
                # Optionally delete the invalid token file
                if os.path.exists(TOKEN_FILE):
                     try:
                         os.remove(TOKEN_FILE)
                         logger.info(f"Removed invalid token file: {TOKEN_FILE}")
                     except OSError as e:
                         logger.error(f"Error removing invalid token file {TOKEN_FILE}: {e}")
                return None

        # Build and cache the service if credentials are valid
        try:
            service = build('gmail', 'v1', credentials=creds)
            _gmail_service = service 
            logger.info("Gmail service built successfully.")
            return service
        except Exception as e:
            logger.error(f"Failed to build Gmail service: {e}", exc_info=True)
            _gmail_service = None # Ensure cache is clear on build failure
            return None

# --- Email Interaction Functions ---

# --- Helper Function --- 
def _parse_from_header(header_value: str) -> Tuple[str, str]:
    """Parses a 'From' header into (name, email)."""
    if not header_value:
        return "Unknown", "Unknown"
    try:
        name, addr = email.utils.parseaddr(header_value)
        # Use name if available, otherwise fallback to the address itself
        return name if name else addr, addr if addr else "Unknown"
    except Exception as e:
        logger.warning(f"Could not parse 'From' header '{header_value}': {e}")
        return header_value, "Unknown" # Fallback

def get_emails(service: Any, max_results: int = 10, query: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetches email summaries (metadata) based on query."""
    global _gmail_service 
    if not service:
        logger.error("Gmail service not available. Cannot fetch emails.")
        raise ValueError("Gmail service not initialized.")
    
    effective_query = query if query else "is:unread"
    logger.info(f"Fetching emails with query: '{effective_query}', max_results: {max_results}")
    
    try:
        result = service.users().messages().list(userId='me', q=effective_query, maxResults=max_results).execute()
        messages = result.get('messages', [])
        if not messages:
            logger.info("No messages found matching the query.")
            return []
        
        emails = []
        for message_info in messages:
            message_id = message_info['id']
            try:
                # Fetch only metadata needed for list view
                msg = service.users().messages().get(userId='me', id=message_id, format='metadata', 
                                                   metadataHeaders=['Subject', 'From', 'Date']).execute()
                
                headers = {header['name'].lower(): header['value'] for header in msg.get('payload', {}).get('headers', [])}
                from_name, from_email = _parse_from_header(headers.get('from', ''))
                labels = msg.get('labelIds', [])
                is_unread = 'UNREAD' in labels

                # Structure for list response model
                email_summary = {
                    'id': message_id,
                    'thread_id': msg.get('threadId', ''),
                    'subject': headers.get('subject', '(No Subject)'),
                    'date': headers.get('date', ''),
                    'snippet': msg.get('snippet', ''), 
                    'from_name': from_name,
                    'from_email': from_email,
                    'unread': is_unread
                }
                emails.append(email_summary)

            except HttpError as inner_error:
                logger.warning(f"HttpError fetching metadata for message {message_id}: {inner_error}") 
                if inner_error.resp.status == 401: 
                     logger.error("Received 401 Unauthorized, clearing cached service.")
                     with _service_lock:
                         _gmail_service = None
                     raise # Re-raise auth error
                continue # Skip this email on other HttpErrors
            except Exception as inner_e:
                logger.error(f"Unexpected error processing message {message_id}: {inner_e}", exc_info=True)
                continue # Skip this email
        
        logger.info(f"Successfully fetched {len(emails)} email summaries.")
        return emails

    except HttpError as error:
        logger.error(f"An HttpError occurred fetching email list: {error}", exc_info=True)
        if error.resp.status == 401: 
             logger.error("Received 401 Unauthorized, clearing cached service.")
             with _service_lock:
                 _gmail_service = None
        raise # Re-raise the exception
    except Exception as e:
        logger.error(f"An unexpected error occurred fetching emails: {e}", exc_info=True)
        raise

def get_email_details(service: Any, email_id: str) -> Optional[Dict[str, Any]]:
    """Fetches full details for a single email by its ID."""
    global _gmail_service 
    if not service:
        logger.error("Gmail service not available. Cannot fetch email details.")
        raise ValueError("Gmail service not initialized.")
    
    logger.info(f"Fetching details for email ID: {email_id}")
    
    try:
        # Request full format and specific headers for replying
        msg = service.users().messages().get(
            userId='me', 
            id=email_id, 
            format='full', 
            metadataHeaders=['Message-ID', 'References', 'Subject', 'From', 'To', 'Cc', 'Bcc', 'Date']
        ).execute()
        
        headers_dict = {}
        raw_headers = {} # Store raw header values if needed later
        if 'payload' in msg and 'headers' in msg['payload']:
             for header in msg['payload']['headers']:
                 name = header.get('name', '').lower()
                 value = header.get('value', '')
                 headers_dict[name] = value
                 raw_headers[header.get('name')] = value

        # --- Body Extraction (Plain Text Preferred, HTML Fallback) --- 
        body = ''
        html_body = '' 
        found_plain = False
        found_html = False
        payload = msg.get('payload', {})

        # 1. Traverse parts if they exist
        if 'parts' in payload:
            for i, part in enumerate(payload['parts']):
                mime_type = part.get('mimeType', '').lower()
                if mime_type == 'text/plain' and not found_plain:
                    body_data = part.get('body', {}).get('data')
                    if body_data:
                        try:
                            body = base64.urlsafe_b64decode(body_data).decode('utf-8', errors='replace')
                            found_plain = True
                        except Exception as decode_err:
                             logger.warning(f"[Email ID: {email_id}] Could not decode text/plain body part {i}: {decode_err}")
                             body = "[Could not decode body]"
                             found_plain = True
                elif mime_type == 'text/html' and not found_html:
                     body_data = part.get('body', {}).get('data')
                     if body_data:
                          try:
                              html_body = base64.urlsafe_b64decode(body_data).decode('utf-8', errors='replace')
                              found_html = True
                          except Exception as decode_err:
                              logger.warning(f"[Email ID: {email_id}] Could not decode text/html body part {i}: {decode_err}")
        
        # 2. If no plain text found in parts, check top-level body
        if not found_plain:
            top_level_mime = payload.get('mimeType', '').lower()
            top_level_body_data = payload.get('body', {}).get('data')
            if top_level_body_data:
                 if top_level_mime == 'text/plain':
                     try:
                         body = base64.urlsafe_b64decode(top_level_body_data).decode('utf-8', errors='replace')
                         found_plain = True
                     except Exception as decode_err:
                         logger.warning(f"[Email ID: {email_id}] Could not decode top-level text/plain body: {decode_err}")
                         body = "[Could not decode body]"
                         found_plain = True
                 elif top_level_mime == 'text/html' and not found_html:
                     try:
                         html_body = base64.urlsafe_b64decode(top_level_body_data).decode('utf-8', errors='replace')
                         found_html = True
                     except Exception as decode_err:
                          logger.warning(f"[Email ID: {email_id}] Could not decode top-level text/html body: {decode_err}")
            
        # 3. If still no plain text body, fall back to stripping HTML
        if not found_plain and found_html:
             logger.info(f"[Email ID: {email_id}] No text/plain body found, falling back to stripped HTML.")
             try:
                 # Simple regex HTML stripping
                 stripped_body = re.sub('<[^>]+>', ' ', html_body) # Replace tags with space
                 stripped_body = re.sub(r'\s+', ' ', stripped_body).strip() # Clean up extra whitespace
                 if stripped_body:
                    body = stripped_body
                 else:
                    logger.warning(f"[Email ID: {email_id}] Stripped HTML resulted in empty content.")
                    body = "" 
             except Exception as strip_err:
                 logger.error(f"[Email ID: {email_id}] Error stripping HTML: {strip_err}")
                 body = "[Could not extract body content]" 
        elif not found_plain and not found_html:
             logger.warning(f"[Email ID: {email_id}] No text/plain or text/html body found or decoded successfully.")
             body = "" 
             
        # --- End Body Extraction --- 
             
        email_details = {
            'id': msg.get('id'),
            'thread_id': msg.get('threadId'),
            'from': headers_dict.get('from', 'Unknown'),
            'to': headers_dict.get('to', 'Unknown'),
            'cc': headers_dict.get('cc'), 
            'bcc': headers_dict.get('bcc'), 
            'subject': headers_dict.get('subject', '(No Subject)'),
            'date': headers_dict.get('date', ''),
            'snippet': msg.get('snippet', ''),
            'body': body,
            'labels': msg.get('labelIds', []),
            'message_id_header': headers_dict.get('message-id'), 
            'references_header': headers_dict.get('references') 
        }
        logger.info(f"Successfully fetched details for email {email_id}.")
        return email_details

    except HttpError as error:
        logger.error(f"HttpError fetching details for message {email_id}: {error}", exc_info=True)
        if error.resp.status == 401: # Unauthorized
             logger.error("Received 401 Unauthorized, clearing cached service.")
             with _service_lock:
                 _gmail_service = None
        elif error.resp.status == 404:
             logger.warning(f"Email with ID {email_id} not found.")
             return None # Indicate not found
        raise # Re-raise other HttpErrors
    except Exception as e:
        logger.error(f"Unexpected error fetching details for email {email_id}: {e}", exc_info=True)
        raise

def send_email(service: Any, to: str, subject: str, body: str, 
               thread_id: Optional[str] = None, 
               in_reply_to: Optional[str] = None, # Value of the Message-ID header of the email being replied to
               references: Optional[str] = None   # Value of the References header (or Message-ID if no References)
               ) -> Optional[Dict[str, Any]]:
    """
    Sends an email using the authenticated Gmail service. 
    Adds threading headers if 'in_reply_to' and 'references' are provided.
    Returns sent message dict or raises Exception.
    """
    global _gmail_service 
    if not service:
        logger.error("Gmail service not available. Cannot send email.")
        raise ValueError("Gmail service not initialized.")
        
    try:
        headers = [
            f"To: {to}",
            f"Subject: {subject}",
            "Content-Type: text/plain; charset=utf-8",
            "MIME-Version: 1.0"
        ]
        if in_reply_to:
            headers.append(f"In-Reply-To: {in_reply_to}")
            # Construct References header according to RFC 2822
            effective_references = references if references else ""
            if in_reply_to not in effective_references: 
                 effective_references = f"{effective_references} {in_reply_to}".strip()
            if effective_references: 
                 headers.append(f"References: {effective_references}")
        
        message_text = "\r\n".join(headers) + f"\r\n\r\n{body}"
        raw_message = base64.urlsafe_b64encode(message_text.encode('utf-8')).decode('utf-8')
        message_payload = {'raw': raw_message}
        
        if thread_id:
            message_payload['threadId'] = thread_id
        
        logger.info(f"Attempting to send email to {to} with subject '{subject}'") # Simplified log
        sent_message = service.users().messages().send(userId='me', body=message_payload).execute()
        logger.info(f"Email sent successfully. Message ID: {sent_message.get('id')}")
        return sent_message
        
    except HttpError as error:
        logger.error(f"An HttpError occurred while sending the email: {error}", exc_info=True)
        if error.resp.status == 401: 
             logger.error("Received 401 Unauthorized, clearing cached service.")
             with _service_lock:
                 _gmail_service = None
        raise 
    except Exception as e:
        logger.error(f"An unexpected error occurred sending email: {e}", exc_info=True)
        raise

def modify_email_labels(service: Any, message_id: str, 
                        labels_to_add: Optional[List[str]] = None, 
                        labels_to_remove: Optional[List[str]] = None) -> bool:
    """
    Adds or removes labels from a specific email message. 
    Returns True on success, False on failure (logs warning).
    Raises Exception on critical errors (like auth).
    """
    global _gmail_service 
    if not service:
        logger.error("Gmail service not available. Cannot modify labels.")
        raise ValueError("Gmail service not initialized.")
        
    try:
        modify_body = {}
        if labels_to_add:
            modify_body['addLabelIds'] = labels_to_add
        if labels_to_remove:
            modify_body['removeLabelIds'] = labels_to_remove
            
        if not modify_body:
            # Removed debug log
            return True # Nothing to do
            
        logger.info(f"Modifying labels for message {message_id}. Add: {labels_to_add}, Remove: {labels_to_remove}")
        service.users().messages().modify(
            userId='me', 
            id=message_id, 
            body=modify_body
        ).execute()
        logger.info(f"Successfully modified labels for message {message_id}.")
        return True
        
    except HttpError as error:
        logger.warning(f"HttpError modifying labels for message {message_id}: {error}")
        if error.resp.status == 401: 
             logger.error("Received 401 Unauthorized, clearing cached service.")
             with _service_lock:
                 _gmail_service = None
             raise 
        elif error.resp.status == 404:
             logger.warning(f"Message {message_id} not found for label modification.")
             # Treat 404 as a non-critical failure for this operation
             return False 
        return False # Other HttpErrors treated as failure
    except Exception as e:
        logger.error(f"Unexpected error modifying labels for message {message_id}: {e}", exc_info=True)
        raise # Re-raise unexpected errors

# --- OpenAI Interaction Functions ---

def classify_email(email_body: str, email_subject: str) -> str:
    """Classifies email content using OpenAI."""
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        logger.error("OpenAI API key (OPENAI_API_KEY) not found in environment variables.")
        return "Error: OpenAI API key not configured" 

    try:
        client = openai.OpenAI(api_key=openai_api_key)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": prompts.GMAIL_CLASSIFY_PROMPT},
                {"role": "user", "content": f"Subject: {email_subject}\n\nBody: {email_body}"}
            ],
            max_tokens=50,
            temperature=0.1 
        )
        classification = response.choices[0].message.content.strip()
        logger.info(f"Email classified as: {classification}")
        return classification
    except Exception as e:
        logger.error(f"OpenAI API call failed during classification: {e}", exc_info=True)
        return "Error: Classification failed"

def generate_reply(email_body: str, email_subject: str, sender_name: str, 
                   tone: str, style: str, length: str, user_context: str = "N/A") -> str:
    """Generates an email reply using OpenAI."""
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        logger.error("OpenAI API key (OPENAI_API_KEY) not found in environment variables.")
        return "Error: OpenAI API key not configured"
    
    try:
        client = openai.OpenAI(api_key=openai_api_key)
        prompt_content = prompts.GMAIL_GENERATE_REPLY_PROMPT.format(
            sender_name=sender_name,
            email_subject=email_subject,
            email_body=email_body,
            tone=tone,
            style=style,
            length=length,
            user_context=user_context
        )
        
        response = client.chat.completions.create(
            model="gpt-4o", 
            messages=[
                {"role": "system", "content": "You are a helpful assistant that drafts email replies."},
                {"role": "user", "content": prompt_content}
            ],
            max_tokens=500, 
            temperature=0.7
        )
        reply = response.choices[0].message.content.strip()
        logger.info(f"Generated reply (length: {len(reply)} chars).")
        return reply
    except Exception as e:
        logger.error(f"OpenAI API call failed during reply generation: {e}", exc_info=True)
        return "Error: Failed to generate reply"

def summarize_email(email_body: str) -> str:
    """Summarizes email content using OpenAI."""
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        logger.error("OpenAI API key (OPENAI_API_KEY) not found in environment variables.")
        return "Error: OpenAI API key not configured"

    try:
        client = openai.OpenAI(api_key=openai_api_key)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": prompts.GMAIL_SUMMARIZE_PROMPT},
                {"role": "user", "content": email_body}
            ],
            max_tokens=150,
            temperature=0.3
        )
        summary = response.choices[0].message.content.strip()
        logger.info(f"Generated summary (length: {len(summary)} chars).")
        return summary
    except Exception as e:
        logger.error(f"OpenAI API call failed during summarization: {e}", exc_info=True)
        return "Error: Failed to generate summary"
