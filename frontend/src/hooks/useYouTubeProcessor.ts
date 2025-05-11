import { useState } from "react";
import { parseYouTubeUrl } from "../utils/youtube";

interface UseYouTubeProcessorProps {
  chunkSize: number;
  chunkOverlap: number;
}

export function useYouTubeProcessor({ chunkSize, chunkOverlap }: UseYouTubeProcessorProps) {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [processingTime, setProcessingTime] = useState<number>(0);

  const handleUrlChange = (url: string) => {
    setVideoUrl(url);
    setError(null);

    // Clear video ID if URL is empty
    if (!url.trim()) {
      setVideoId(null);
      return;
    }

    // Try to parse the URL
    try {
      const id = parseYouTubeUrl(url);
      setVideoId(id);
    } catch (err) {
      setVideoId(null);
    }
  };

  const processTranscript = async () => {
    if (!videoId) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsSuccess(false);
    
    // Start timing
    const startTime = performance.now();

    try {
      // Log request details
      console.log("Sending request to process YouTube URL:", videoUrl);
      console.log("Chunk size:", chunkSize);
      console.log("Chunk overlap:", chunkOverlap);

      // Call the API with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout (processing transcripts can take time)

      // Display processing message
      console.log("Processing transcript. This may take 1-2 minutes...");

      const response = await fetch(`/api/v1/youtube/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          url: videoUrl,
          chunk_size: chunkSize,
          chunk_overlap: chunkOverlap,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP error status
      if (!response.ok) {
        console.error("API returned error status:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        
        // Try to parse as JSON if possible
        try {
          if (errorText) {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.detail || `API error: ${response.status}`);
          }
        } catch (e) {
          // If parsing fails, use the text or status
          throw new Error(errorText || `API error: ${response.status}`);
        }
      }

      // Read and parse the response
      const responseText = await response.text();
      
      if (!responseText) {
        throw new Error("Empty response from server");
      }
      
      try {
        const data = JSON.parse(responseText);
        console.log("API response:", data);
        
        if (!data.success) {
          throw new Error(data.message || "Processing failed");
        }
        
        // Calculate processing time
        const endTime = performance.now();
        const totalTimeSeconds = Math.round((endTime - startTime) / 1000);
        setProcessingTime(totalTimeSeconds);
        
        setIsSuccess(true);
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError("Request timed out. Processing YouTube videos can take several minutes. Please try again or use a shorter video.");
      } else {
        console.error("Error processing transcript:", err);
        setError(err instanceof Error ? err.message : "Failed to process transcript. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    videoUrl,
    videoId,
    isProcessing,
    error,
    isSuccess,
    processingTime,
    handleUrlChange,
    processTranscript,
  };
} 