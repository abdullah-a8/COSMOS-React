from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl, EmailStr
from datetime import datetime

# Request Models
class EmailQueryRequest(BaseModel):
    query: str = Field("is:unread", description="Gmail search query")
    max_results: int = Field(10, description="Maximum number of emails to fetch")

class EmailReplyRequest(BaseModel):
    email_id: str = Field(..., description="The ID of the email to reply to")
    tone: str = Field("professional", description="The tone of the reply")
    style: str = Field("concise", description="The style of the reply")
    length: str = Field("medium", description="The length of the reply")
    context: Optional[str] = Field(None, description="Additional context for the reply")

class EmailSendRequest(BaseModel):
    email_id: str = Field(..., description="The ID of the email to reply to")
    reply_text: str = Field(..., description="The text of the reply to send")

# Response Models
class EmailSummary(BaseModel):
    id: str = Field(..., description="Email ID")
    snippet: str = Field(..., description="Email snippet")
    subject: str = Field(..., description="Email subject")
    from_name: str = Field(..., description="Sender name")
    from_email: str = Field(..., description="Sender email")
    date: str = Field(..., description="Email date")
    unread: bool = Field(..., description="Whether the email is unread")

class EmailListResponse(BaseModel):
    success: bool = Field(..., description="Whether the emails were fetched successfully")
    emails: Optional[List[EmailSummary]] = Field(None, description="List of email summaries")
    message: Optional[str] = Field(None, description="Error message if fetching failed")

class EmailDetailResponse(BaseModel):
    success: bool = Field(..., description="Whether the email detail was fetched successfully")
    email: Optional[Dict[str, Any]] = Field(None, description="Detailed email information")
    message: Optional[str] = Field(None, description="Error message if fetching failed")

class EmailClassificationResponse(BaseModel):
    success: bool = Field(..., description="Whether the email was classified successfully")
    classification: Optional[str] = Field(None, description="Email classification")
    message: Optional[str] = Field(None, description="Error message if classification failed")

class EmailSummaryResponse(BaseModel):
    success: bool = Field(..., description="Whether the email was summarized successfully")
    summary: Optional[str] = Field(None, description="Email summary")
    message: Optional[str] = Field(None, description="Error message if summarization failed")

class EmailReplyResponse(BaseModel):
    success: bool = Field(..., description="Whether the reply was generated successfully")
    reply: Optional[str] = Field(None, description="Generated reply")
    message: Optional[str] = Field(None, description="Error message if generation failed")

class EmailSendResponse(BaseModel):
    success: bool = Field(..., description="Whether the reply was sent successfully")
    sent_message_id: Optional[str] = Field(None, description="ID of the sent message if successful")
    message: Optional[str] = Field(None, description="Error message if sending failed")

class EmailModifyResponse(BaseModel):
    success: bool = Field(..., description="Whether the labels were modified successfully")
    message: Optional[str] = Field(None, description="Status message or error details")

# Define response model for the auth URL
class GmailAuthUrlResponse(BaseModel):
    auth_url: HttpUrl

class EmailInfo(BaseModel):
    id: str
    thread_id: str
    subject: Optional[str] = None
    from_addr: Optional[EmailStr] = Field(None, alias='from')
    date: Optional[str] = None

    class Config:
        populate_by_name = True

class EmailDetail(EmailInfo):
    to_addr: Optional[List[EmailStr]] = Field(None, alias='to')
    body: Optional[str] = None
    labels: List[str] = []

    class Config:
        populate_by_name = True

class GenerateReplyRequest(BaseModel):
    tone: str = "professional"
    style: str = "concise"
    length: str = "medium"
    context: Optional[str] = None

class SendReplyRequest(BaseModel):
    reply_text: str