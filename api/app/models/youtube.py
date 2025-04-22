from typing import Optional
from pydantic import BaseModel, Field, HttpUrl

# Request Models
class YouTubeRequest(BaseModel):
    url: str = Field(..., description="The YouTube video URL")
    chunk_size: int = Field(512, description="The size of each text chunk")
    chunk_overlap: int = Field(50, description="The overlap between adjacent chunks")

# Response Models
class YouTubeResponse(BaseModel):
    success: bool = Field(..., description="Whether the video transcript was processed successfully")
    video_id: Optional[str] = Field(None, description="The YouTube video ID")
    chunk_count: Optional[int] = Field(None, description="The number of chunks created")
    message: Optional[str] = Field(None, description="Error message if processing failed") 