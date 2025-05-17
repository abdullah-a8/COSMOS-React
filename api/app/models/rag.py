from typing import Dict, Optional, List, Any, Union
from pydantic import BaseModel, Field

# Request Models
class QueryRequest(BaseModel):
    query: str = Field(..., description="The question to ask the RAG system")
    model_name: str = Field("llama3-8b-8192", description="The name of the LLM model to use")
    temperature: float = Field(0.7, description="Temperature parameter for the LLM")
    filter_sources: Optional[Dict[str, bool]] = Field(
        None, 
        description="Filters for specific source types (pdf, url, youtube)"
    )
    session_id: Optional[str] = Field(None, description="Session ID for chat history persistence")
    is_system_message: Optional[bool] = Field(False, description="Flag to indicate if this is a system message for topic reset")

class ProcessDocumentRequest(BaseModel):
    chunk_size: int = Field(512, description="The size of each text chunk")
    chunk_overlap: int = Field(50, description="The overlap between adjacent chunks")

class URLRequest(BaseModel):
    url: str = Field(..., description="The URL to process")
    chunk_size: int = Field(512, description="The size of each text chunk")
    chunk_overlap: int = Field(50, description="The overlap between adjacent chunks")

# Timing info model
class TimingInfo(BaseModel):
    chain_init: float = Field(..., description="Time taken to initialize the chain (seconds)")
    retrieval: float = Field(..., description="Time taken to retrieve documents (seconds)")
    context_formatting: float = Field(..., description="Time taken to format context (seconds)")
    llm_generation: float = Field(..., description="Time taken for LLM generation (seconds)")
    total: float = Field(..., description="Total processing time (seconds)")

# Response Models
class QueryResponse(BaseModel):
    answer: str = Field(..., description="The answer from the RAG system")
    success: bool = Field(..., description="Whether the query was successful")
    timing: Optional[TimingInfo] = Field(None, description="Timing information for performance monitoring")
    session_id: Optional[str] = Field(None, description="Session ID for chat history persistence")
    
class ProcessDocumentResponse(BaseModel):
    success: bool = Field(..., description="Whether the document was processed successfully")
    document_id: Optional[str] = Field(None, description="The ID of the processed document")
    chunk_count: Optional[int] = Field(None, description="The number of chunks created")
    message: Optional[str] = Field(None, description="Error message if processing failed")

# Add response model for URL processing
class URLProcessResponse(ProcessDocumentResponse):
    # Inherits fields from ProcessDocumentResponse
    # document_id will typically be the URL itself
    pass

# Add response model for image processing
class ImageProcessResponse(ProcessDocumentResponse):
    # Inherits fields from ProcessDocumentResponse
    # document_id will be the image hash
    ocr_status: Optional[str] = Field(None, description="Status of OCR processing")

class SourceInfoResponse(BaseModel):
    source_types: List[str] = Field(..., description="List of available source types")
    document_count: int = Field(..., description="Total number of documents")
    source_counts: Dict[str, int] = Field(..., description="Counts of documents by source type") 