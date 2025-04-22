import os
from dotenv import load_dotenv
load_dotenv()

# --- Security ---
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-default-placeholder-change-me")

# Fallback for development if SECRET_KEY is not set
if SECRET_KEY == "django-insecure-default-placeholder-change-me":
    print("Security Risk: SECRET_KEY is using the default placeholder. Set a strong secret key in .env or environment variables.")

# --- API Keys ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT")

# --- Model Configuration ---
DEFAULT_MODEL_NAME = "mixtral-8x7b-32768"
DEFAULT_TEMPERATURE = 0.7

# --- Processing Configuration ---
DEFAULT_CHUNK_SIZE = 300
DEFAULT_CHUNK_OVERLAP = 50 