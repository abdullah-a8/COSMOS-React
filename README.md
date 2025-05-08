# COSMOS - Collaborative Organized System for Multiple Operating Specialists

![COSMOS Banner](./Images/COSMOS_1.png)

## Project Intuition

In today's information-rich world, dealing with diverse content streams – documents, online articles, videos, emails – can be overwhelming. Traditional tools often operate in silos, forcing users to switch contexts constantly. COSMOS was born from the idea of creating a unified, intelligent workspace where specialized AI agents can collaborate to manage this information seamlessly.

The core intuition is to leverage the strengths of different AI models and techniques:

- **Retrieval-Augmented Generation (RAG)**: Provides a powerful way to ground AI responses in factual information from provided sources, reducing hallucinations and improving accuracy when chatting about documents or other knowledge base content.
- **Specialized Agents**: Recognizes that different tasks require different approaches. A dedicated Gmail agent understands email context better, while a YouTube processor knows how to handle transcripts effectively.
- **Collaborative Ecosystem**: Instead of isolated tools, COSMOS integrates these agents. Knowledge extracted by one agent (like the YouTube processor) becomes available to others (like the RAG chatbot), creating a synergistic effect.

COSMOS aims to be more than just a collection of tools; it's envisioned as an extensible platform where new intelligent agents can be added over time, creating a truly comprehensive digital assistant.

## Overview

COSMOS is an integrated AI assistant platform built with a modern tech stack featuring React, FastAPI, and LangChain. It brings together multiple specialized agents, each designed for a specific task, allowing them to work together within a single interface. Whether you need to query documents, process YouTube videos, or manage your Gmail inbox, COSMOS provides dedicated AI specialists to help.

The system combines Retrieval-Augmented Generation (RAG) for knowledge-based chat with specialized agents for tasks like email handling and video transcript processing, creating a versatile and collaborative AI workspace.

## Features

### 🤖 RAG Chatbot
- **Multi-Model Flexibility**: Choose from a wide range of Large Language Models (LLMs) via Groq (Llama, Mistral, Mixtral, Gemma, etc.) to tailor performance and cost.
- **Unified Knowledge Base**: Ingests and processes content from PDFs, web URLs, and YouTube transcripts (processed by the YouTube agent), making all information searchable in one place.
- **Contextual Chat**: Uses RAG to retrieve relevant text chunks from the knowledge base before generating answers, ensuring responses are grounded in the provided content.
- **Source Tracking**: Identifies the source of information (PDF, URL, YouTube) within the knowledge base.
- **Fine-tuning Parameters**: Allows users to adjust LLM temperature, chunk size, and chunk overlap to optimize retrieval and response generation for different needs.

### 🎥 YouTube Processor
- **Automated Transcript Extraction**: Simply provide a YouTube URL, and the agent fetches the video transcript using the `youtube-transcript-api` and `yt-dlp`.
- **Content Preparation**: Processes the extracted transcript, breaking it into manageable chunks suitable for the vector database, using the same core processing logic as other content types.
- **Knowledge Base Integration**: Embeds and stores the transcript chunks in the Pinecone vector database, making the video content searchable by the RAG Chatbot.
- **User Feedback**: Provides real-time status updates during processing and displays the video thumbnail for confirmation.

### 📧 Gmail Response Assistant
- **Secure Authentication**: Uses Google OAuth 2.0 for secure access to your Gmail account.
- **Intelligent Email Processing**: Fetches emails based on user queries (e.g., `is:unread`).
- **AI-Powered Analysis**: Uses the OpenAI API directly to:
    - **Classification**: Automatically categorize emails (e.g., Inquiry, Promotion, Personal).
    - **Summarization**: Generate concise summaries of long emails.
- **Contextual Reply Generation**: Drafts email replies using the OpenAI API based on the original email's content, subject, and sender, allowing users to specify tone, style, length, and provide additional context.
- **Direct Sending**: Sends the drafted (and potentially edited) replies directly from the interface using the Gmail API, automatically handling threading.
- **Label Management**: Marks replied-to emails as read automatically by removing the `UNREAD` label.

## Technical Architecture

COSMOS utilizes a modern architecture with React for the frontend, FastAPI for the backend API, and LangChain for orchestrating AI components.

### Core Components (`core/`)

- **`data_extraction.py`**: Contains functions to extract raw text content from different sources (PDFs via `PyMuPDF`, URLs via `newspaper4k`, YouTube transcripts via `youtube-transcript-api` and `yt-dlp`).
- **`processing.py`**: Takes raw text and a source identifier, performs text splitting (`RecursiveCharacterTextSplitter` from LangChain), enriches chunks with metadata (source type, URL, domain, timestamp, chunk sequence), and prepares them for embedding.
- **`vector_store.py`**: Handles interactions with the Pinecone vector database. It initializes the connection using environment variables and provides functions to add processed document chunks (with embeddings generated via `OpenAIEmbeddings` using the `text-embedding-3-large` model) to the specified Pinecone index.
- **`chain.py`**: Sets up the core LangChain sequence (LCEL) for the RAG functionality. It defines the prompt template (`ChatPromptTemplate`), initializes the selected ChatGroq LLM model with specific temperature settings, and includes the output parser (`StrOutputParser`).
- **`agents/gmail_logic.py`**: Encapsulates all logic related to the Gmail agent, including OAuth authentication (`google-auth-oauthlib`, `google-api-python-client`), fetching/sending emails, and interacting *directly* with the OpenAI API (`openai` library) for classification, summarization, and reply generation using predefined prompts.

### C++ Extensions (`cpp_extensions/`)

COSMOS leverages high-performance C++ modules to accelerate critical operations, with fallback to Python implementations when necessary.

- **`text_chunking/text_chunker.cpp`**: A C++ implementation of text chunking that significantly improves processing speed compared to the Python implementation. It mimics LangChain's RecursiveCharacterTextSplitter with optimized algorithms for splitting text by paragraphs, newlines, or characters.
- **`pdf_extraction/pdf_extractor.cpp`**: Combines PDF text extraction and hash generation into a single optimized C++ operation. Uses Poppler for fast PDF parsing with minimal overhead.
- **`hash_generation/hash_generator.cpp`**: Provides optimized SHA-256 hash generation for content identification and verification, with specialized versions for different Python data types.

These extensions are built using pybind11 for seamless Python integration and implement graceful fallback mechanisms. The system checks for availability of the C++ modules at runtime and defaults to pure Python implementations if needed, ensuring compatibility across different environments while providing substantial performance benefits when available.

### API and Frontend Structure

- **API (`api/app/`)**: 
  - **`main.py`**: The FastAPI application entry point
  - **`dependencies.py`**: Contains dependency injection components
  - **`routers/`**: API route definitions
  - **`models/`**: Pydantic data models
  - **`services/`**: Business logic implementations
  - **`utils/`**: Helper functions and utilities

- **Frontend (`frontend/`)**: 
  - Built with React + Vite
  - Uses Radix UI components
  - TailwindCSS for styling
  - TypeScript for type safety

### Data Flow (RAG Example)

1.  **Upload/Input**: User provides a PDF, URL, or YouTube URL via the React frontend UI.
2.  **API Request**: The frontend sends the input to the FastAPI backend.
3.  **Extraction**: Backend calls `core/data_extraction.py` to extract text.
4.  **Processing**: Backend calls `core/processing.py` to split text and add metadata.
5.  **Embedding & Storage**: Backend calls `core/vector_store.py` to generate embeddings and store them in Pinecone.
6.  **Query**: User asks a question in the RAG Chatbot UI.
7.  **API Request**: Frontend sends the query to the FastAPI backend.
8.  **Retrieval**: Backend queries the Pinecone vector store for relevant chunks.
9.  **Augmentation**: Backend combines the context and question.
10. **Generation**: Backend sends the augmented prompt to the LLM via `core/chain.py`.
11. **API Response**: Backend sends the LLM's response back to the frontend.
12. **Display**: The response is displayed in the React UI.

## Screenshots

### Home and Authentication

![Beta Authentication Screen](./Images/screenshots/auth.png)
*The initial beta authentication screen requiring a password to access the application.*

![COSMOS Home Dashboard](./Images/screenshots/home.png)
*The main dashboard showing available agents and quick access navigation.*

### RAG Chatbot

![RAG Chatbot Interface](./Images/screenshots/rag_chatbot.png)
*The main RAG Chatbot interface with chat history and input field.*

![Document Upload](./Images/screenshots/document_upload.png)
*PDF and URL upload interface for adding documents to the knowledge base.*

![RAG Settings Panel](./Images/screenshots/rag_settings.png)
*Configurable settings for the RAG system including model selection, temperature, and chunking parameters.*

![RAG Chat with Source References](./Images/screenshots/rag_sources.png)
*A sample conversation showing answers with source attribution to specific documents.*

### YouTube Processor

![YouTube URL Input](./Images/screenshots/youtube_input.png)
*The YouTube processor interface for entering video URLs.*

![YouTube Processing Status](./Images/screenshots/youtube_processing.png)
*Real-time status updates during transcript extraction and processing.*

![YouTube Successful Processing](./Images/screenshots/youtube_success.png)
*Confirmation screen showing the successfully processed video with thumbnail.*

### Gmail Response Assistant

![Gmail Coming Soon](./Images/screenshots/gmail_coming_soon.png)
*The Gmail Response Assistant "Coming Soon" screen in the React frontend. This feature is currently being ported from the Streamlit implementation.*

### Mobile Responsiveness

![Mobile Authentication](./Images/screenshots/mobile_auth.png)
*The beta authentication screen optimized for mobile devices.*

![Mobile Home View](./Images/screenshots/mobile_home.png)
*The responsive mobile view of the home dashboard.*

![Mobile RAG Chat](./Images/screenshots/mobile_rag.png)
*The RAG Chatbot interface optimized for mobile devices.*

![Mobile RAG Settings](./Images/screenshots/mobile_rag_settings.png)
*The RAG Chatbot settings panel on mobile, allowing configuration of model parameters.*

![Mobile YouTube Processor](./Images/screenshots/mobile_youtube.png)
*The YouTube processor interface adapted for mobile viewing.*

![Mobile YouTube Settings](./Images/screenshots/mobile_youtube_settings.png)
*YouTube processor settings and status display on mobile devices.*

![Mobile Gmail Coming Soon](./Images/screenshots/mobile_gmail.png)
*The Gmail "Coming Soon" screen on mobile, showing the feature is in development.*

## Getting Started

### Prerequisites

- Python 3.13 (as specified in `.python-version`)
- Node.js 22.14.0 (as specified in `package.json` and `frontend/package.json`)
- Pip (Python package installer)
- Git
- C++ compiler (GCC/Clang for Linux/macOS, MSVC for Windows)
- CMake 3.30.0+ (for building C++ extensions)
- OpenSSL development libraries (e.g., `openssl-devel` on Fedora/RHEL, `libssl-dev` on Debian/Ubuntu)
- Poppler development libraries (e.g., `poppler-cpp-devel` on Fedora/RHEL, `libpoppler-cpp-dev` on Debian/Ubuntu)
- Pinecone Account: Sign up at [Pinecone](https://www.pinecone.io/) and create an index. Note the API key and index name.
- OpenAI API Key: Obtain from [OpenAI](https://platform.openai.com/signup/) (used for embeddings and Gmail agent functions).
- Groq API Key (Optional but Recommended): Obtain from [Groq](https://groq.com/) for access to fast LLMs used in the RAG chatbot.
- Google Cloud Project with Gmail API Enabled:
    - Follow Google's documentation to create a project and enable the Gmail API.
    - Create OAuth 2.0 Client ID credentials (Desktop application type).
    - Download the `credentials.json` file.

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/abdullah-a8/COSMOS.git
    cd COSMOS
    ```

2.  **Set Up Virtual Environment**: (Recommended)
    It's good practice to create a virtual environment to manage project dependencies.
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # Linux/macOS
    # OR
    .venv\Scripts\activate  # Windows
    ```

3.  **Install Python Dependencies**:
    Install all necessary Python packages listed in `requirements.txt`.
    ```bash
    pip install -r requirements.txt
    # Also install API-specific requirements
    pip install -r api/requirements.txt
    ```

4.  **Install Frontend Dependencies & Build**:
    The frontend is a React application built with Vite:
    ```bash
    cd frontend
    npm install --legacy-peer-deps 
    # To run the development server (usually on http://localhost:3000):
    # npm run dev
    # To build the static assets:
    # npm run build
    cd ..
    ```

5.  **Configure Environment Variables**:
    Create a file named `.env` in the project root directory. This file is used by `python-dotenv` to load your sensitive API keys and configuration settings.
    Add the following, replacing the placeholder values with your actual credentials:
    ```dotenv
    OPENAI_API_KEY="your_openai_api_key"
    GROQ_API_KEY="your_groq_api_key"
    PINECONE_API_KEY="your_pinecone_api_key"
    PINECONE_INDEX_NAME="your_pinecone_index_name"
    ```
    **Important**: Ensure your Pinecone index is configured with **3072 dimensions** to match the `text-embedding-3-large` model used for OpenAI embeddings.

6.  **Configure Beta Authentication** (Recommended for Production):
    The application includes a "Closed Beta" authentication system to protect your API endpoints from unauthorized access. By default, it uses a simple password protection system with the following settings:
    
    ```dotenv
    # Add these to your .env file to customize beta authentication
    COSMOS_BETA_PASSWORD="your_secure_beta_password"  # Default: "CosmosClosedBeta2025"
    BETA_ENABLED=true                                 # Set to "false" to disable beta auth
    ```
    
    When enabled, users will be presented with a password protection screen before accessing any part of the application. The session expires after 60 minutes, requiring re-authentication. This helps prevent abuse of your API endpoints while in beta testing.

7.  **Build C++ Extensions** (Optional but Recommended):
    These extensions improve performance for text chunking, PDF extraction, and hashing. Build them *after* installing system dependencies:
    ```bash
    cd cpp_extensions
    python setup.py build_ext --inplace
    cd .. 
    
    # Copy extensions to the correct location for the application to find
    # Ensure the target directory exists
    mkdir -p core/cpp_modules
    # Use find to copy all .so files, handling potential platform differences
    find cpp_extensions -name '*.so' -exec cp {} core/cpp_modules/ \;
    ```
    The application uses an `__init__.py` in `core/cpp_modules/` to dynamically load these extensions if available, falling back to pure Python implementations otherwise.

8.  **Set Up Gmail Credentials**:
    - Create a `credentials` directory in the project root if it doesn't exist: `mkdir -p credentials`
    - Place the `credentials.json` file you downloaded from Google Cloud inside this directory.
    - **Rename** the file to `.gmail_credentials.json`. (The leading dot helps keep it slightly hidden and matches the code).
    *(This file is ignored by `.gitignore` to prevent accidental commits)*

### Running the Application

The application consists of a React frontend, a FastAPI backend, and a standalone Streamlit page for the Gmail agent.

1.  **Start the Backend API**:
    Navigate to the project root directory in your terminal. Run the Uvicorn server:
    ```bash
    uvicorn api.app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    The API documentation (Swagger UI) will be available at `http://localhost:8000/docs`.

2.  **Start the Frontend Development Server**:
    Open a *new* terminal window/tab. Navigate to the `frontend` directory and start the React development server:
    ```bash
    cd frontend
    npm run dev
    ```
    This will open the application in your default web browser, typically at `http://localhost:5173`. Access the RAG Chatbot and YouTube Processor here.

3.  **Run the Gmail Agent (Streamlit)**:
    Open *another* new terminal window/tab, ensure your virtual environment is activated, and run the specific Streamlit page:
    ```bash
    streamlit run pages/3_Gmail_Agent.py
    ```
    Access the Gmail Agent via the URL provided by Streamlit (usually `http://localhost:8501`).

4.  **Gmail Authentication (First Run)**: When you navigate to the Gmail Agent page (`http://localhost:8501`) for the first time, you'll be prompted to authenticate. Click the "Connect to Gmail" button and follow the Google authentication flow. A `.gmail_token.json` file will be created in the `credentials` directory.

## Usage Guide

### Working with the RAG Chatbot

1.  Navigate to the **RAG Chatbot** page in the React frontend.
2.  **Add Content**: Use the options to upload PDF files or enter web URLs. The system will process them and add them to the Pinecone knowledge base.
3.  **Configure Settings**: Adjust the LLM model, temperature, chunk size, and overlap in the settings panel to control how the chatbot retrieves information and generates responses.
4.  **Chat**: Type your questions about the ingested content into the chat input.

### Processing YouTube Videos

1.  Go to the **YouTube Processor** page in the React frontend.
2.  Paste the full URL of the YouTube video you want to process.
3.  Click **Process YouTube Transcript**.
4.  Wait for the processing to complete (status updates are shown).
5.  Once successful, the video's transcript is added to the knowledge base and can be queried via the RAG Chatbot.

### Using the Gmail Assistant

1.  Navigate to the **Gmail Agent** page via the Streamlit URL.
2.  **Authenticate**: If not already connected, click "Connect to Gmail" and follow the Google authentication flow.
3.  **Fetch Emails**: Use the search query input (default `is:unread`) and adjust the maximum results slider, then click "Fetch Emails".
4.  **Select Email**: Choose an email from the dropdown list in the sidebar.
5.  **Analyze**:
    - Click **Classify Email** to get an AI-determined category.
    - Click **Summarize Email** to generate a concise summary.
6.  **Generate Reply**:
    - Select the desired tone, style, and length for the reply.
    - Add any specific instructions or context in the "Optional Context" box.
    - Click **Generate Draft Reply**.
7.  **Edit & Send**: Review the generated draft in the text area. Make any necessary edits, then click **Send Reply**. The email will be sent using your Gmail account, and the original email will be marked as read.

## Customization

### Modifying LLM Settings

Default parameters like temperature and chunking settings can be adjusted directly in `config/settings.py`.

### Adding/Modifying Prompts

The prompts used for RAG, email classification, summarization, and reply generation are stored in `config/prompts.py`. You can edit these to change the AI's behavior or tailor its responses.

### Extending with New Agents

The modular structure (`core/agents/`) is designed for extension. To add a new agent (e.g., a Calendar Agent):
1. Create a new logic file (e.g., `core/agents/calendar_logic.py`) containing the core functionality (API interaction, processing logic).
2. Create a new Streamlit page (e.g., `pages/4_Calendar_Agent.py`) for the UI, importing functions from your new logic file.
3. Add necessary dependencies to `requirements.txt`.
4. Update environment variables (`.env`) and configuration (`config/`) if needed.

## Project Structure

```
COSMOS/
├── frontend/               # React frontend built with Vite & TypeScript
│   ├── src/                # Source code
│   ├── dist/               # Build output
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── api/                    # FastAPI backend source code
│   ├── app/                # Main application logic
│   │   ├── main.py         # FastAPI application instance
│   │   ├── dependencies.py # Dependency injection
│   │   ├── routers/        # API endpoints
│   │   ├── models/         # Pydantic data models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   ├── requirements.txt    # API-specific dependencies
│   └── run.py              # Helper script for development
├── pages/
│   └── 3_Gmail_Agent.py    # UI for Gmail integration (Streamlit)
├── core/
│   ├── chain.py            # LangChain setup for LLM interaction (RAG)
│   ├── data_extraction.py  # Functions for extracting text from sources
│   ├── processing.py       # Text chunking and metadata enrichment logic
│   ├── vector_store.py     # Pinecone connection and vector operations
│   ├── cpp_modules/        # Loaded C++ extensions
│   └── agents/
│       └── gmail_logic.py  # Core logic for Gmail agent
├── cpp_extensions/         # C++ performance modules
│   ├── text_chunking/
│   ├── pdf_extraction/
│   ├── hash_generation/
│   ├── setup.py            # Build script for C++ extensions
│   └── CMakeLists.txt
├── config/
│   ├── settings.py         # Default application settings
│   └── prompts.py          # Prompt templates
├── credentials/            # Directory for credentials (token, .json)
├── Images/                 # Banner and other images
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (API keys, etc.)
├── .gitignore              # Files to ignore in version control
├── LICENSE                 # MIT License
├── README.md               # This documentation file
├── Procfile                # Heroku deployment configuration
├── package.json            # Root npm configuration for Heroku
└── .python-version         # Specifies Python 3.13
```

## Deployment (Heroku)

The project is configured for deployment on Heroku with the following setup:

-   **`Procfile`