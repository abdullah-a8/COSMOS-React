import fitz
from newspaper import Article
from time import sleep
import hashlib
from youtube_transcript_api import YouTubeTranscriptApi

# Try to import the C++ implementations first, fall back to Python if not available
try:
    from core.cpp_modules import hash_generator
    USE_CPP_HASH = True
    print("Using C++ hash generator for improved performance")
except ImportError:
    USE_CPP_HASH = False
    print("C++ hash generator not available, using Python implementation")

try:
    from core.cpp_modules import pdf_extractor
    USE_CPP_PDF = True
    print("Using C++ PDF extractor for improved performance")
except ImportError:
    USE_CPP_PDF = False
    print("C++ PDF extractor not available, using Python implementation")

def extract_text_from_pdf(file):
    try:
        file_content = file.read()
        
        if USE_CPP_PDF:
            # Use C++ implementation for PDF extraction and hashing
            try:
                text, pdf_hash = pdf_extractor.extract_pdf_text_and_hash(file_content)
                return text, pdf_hash
            except Exception as e:
                print(f"C++ PDF extraction failed, falling back to Python: {e}")
                # Fall back to Python implementation on error
                file.seek(0)  # Reset file pointer
                file_content = file.read()
        
        # Python implementation
        if USE_CPP_HASH:
            # Use C++ implementation just for hashing
            pdf_hash = hash_generator.compute_sha256(file_content)
        else:
            # Pure Python implementation for hashing
            pdf_hash = hashlib.sha256(file_content).hexdigest()
            
        # Use Python implementation for PDF extraction
        pdf_document = fitz.open("pdf", file_content)
        all_text = ""
        for page_number in range(pdf_document.page_count):
            page = pdf_document[page_number]
            all_text += page.get_text()
        pdf_document.close()
        return all_text, pdf_hash
    except Exception as e:
        return f"Error reading PDF: {e}", None

def extract_text_from_url(url, retries=3):
    for attempt in range(retries):
        try:
            article = Article(url)
            article.download()
            article.parse()

            if len(article.text.strip()) == 0:
                raise ValueError("No text extracted. The article might be behind a paywall or inaccessible.")

            return article.text, url
        except Exception as e:
            if attempt < retries - 1:
                sleep(2)
                continue
            return f"Error processing URL after {retries} attempts: {e}", None

def extract_transcript_details(youtube_video_url):
    try:
        if "v=" in youtube_video_url:
            video_id = youtube_video_url.split("v=")[1].split("&")[0]
        elif "youtu.be/" in youtube_video_url:
            video_id = youtube_video_url.split("youtu.be/")[1].split("?")[0]
        else:
            return "Error: Invalid YouTube URL format.", None

        print(f"Extracting transcript for video ID: {video_id}")
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)

        transcript = " ".join([i["text"] for i in transcript_list])

        if not transcript:
            return "Error: Could not retrieve transcript (may be disabled for this video).", f"youtube_{video_id}"

        return transcript, f"youtube_{video_id}"

    except Exception as e:
        print(f"Error in YouTube transcript extraction: {e}")
        video_id_on_error = None
        if 'video_id' in locals():
            video_id_on_error = f"youtube_{video_id}"
        return f"Error retrieving transcript: {e}", video_id_on_error 