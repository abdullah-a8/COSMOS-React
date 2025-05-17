import { useState, useCallback, useEffect, useRef } from 'react';

interface RagMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SourceFilters {
  pdf: boolean;
  url: boolean;
  youtube: boolean;
  image: boolean;
}

interface PdfUploadResponse {
  success: boolean;
  document_id?: string;
  chunk_count?: number;
  message?: string;
}

interface UrlProcessResponse {
  success: boolean;
  document_id?: string;
  chunk_count?: number;
  message?: string;
}

interface ImageProcessResponse {
  success: boolean;
  document_id?: string;
  chunk_count?: number;
  ocr_status?: string; 
  message?: string;
}

interface TimingInfo {
  chain_init: number;
  retrieval: number;
  context_formatting: number;
  llm_generation: number;
  total: number;
}

interface QueryResponse {
  answer: string;
  success: boolean;
  timing?: TimingInfo;
  session_id?: string;  // Add session_id to response
}

// API base URL
const API_BASE = import.meta.env.PROD ? '/api/v1' : 'http://localhost:8000/api/v1';

export function useRagChatbot(chunkSize: number, chunkOverlap: number) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'pdf' | 'url' | 'image'>('pdf');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isQueryProcessing, setIsQueryProcessing] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [messages, setMessages] = useState<RagMessage[]>([
    { role: 'system', content: 'How can I help you?' },
  ]);
  const [sourceFilters, setSourceFilters] = useState<SourceFilters>({
    pdf: true,
    url: true,
    youtube: true,
    image: true,
  });
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // State to track and persist the chat session ID
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Timer state management - simplified to match YouTube processor
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Initialize with localStorage session ID on component mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem('chatSessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      console.log('Restored chat session:', storedSessionId);
    } else {
      // If no session ID exists, generate a new one and store it
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      localStorage.setItem('chatSessionId', newSessionId);
      console.log('Created new chat session:', newSessionId);
    }
  }, []);  // Empty dependency array means this runs once on mount

  // URL change handler
  const handleUrlChange = useCallback((newUrl: string) => {
    setUrl(newUrl);
  }, []);

  // File change handler
  const handleFileChange = useCallback((newFile: File | null) => {
    setFile(newFile);
  }, []);

  // Reset function - keeps session ID
  const reset = useCallback(() => {
    setFile(null);
    setUrl('');
    setIsProcessing(false);
    setIsQueryProcessing(false);
    setUploadStatus('idle');
    setMessages([{ role: 'system', content: 'How can I help you?' }]);
    setUploadProgress(0);
    setStatusMessage('');
    
    // Reset timer states
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    startTimeRef.current = null;
    setElapsedTime(0);
    setProcessingTime(0);
  }, []);

  // Modified clear conversation function
  const clearConversation = () => {
    // Clear messages from UI but preserve the session
    setMessages([{ role: 'system', content: 'How can I help you?' }]);
    setIsQueryProcessing(false);
    
    // Instead of completely clearing memory, add a special message to indicate topic reset
    // This helps maintain session continuity while signaling a context break
    if (sessionId) {
      // Add a special system message to mark topic reset
      const resetMessage = "Topic reset by user. New conversation starting.";
      
      // This is an informational console log, not displayed to the user
      console.log('Conversation cleared but maintaining session ID:', sessionId);
      
      // Optionally, send a system message to the backend to mark the topic change
      try {
        fetch(`${API_BASE}/rag/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            query: resetMessage,
            model_name: "system",  // Use "system" as a marker for non-user messages
            temperature: 0,
            filter_sources: {},
            session_id: sessionId,
            is_system_message: true  // Add an indicator this is a system message
          }),
        }).catch(err => {
          // Silently handle errors - this is a best-effort operation
          console.error("Failed to add reset marker to conversation history:", err);
        });
      } catch (e) {
        // Ignore errors in this optional operation
        console.log("Error adding reset message to history:", e);
      }
    }
  };

  // Only clear session ID when explicitly starting a new session
  const startNewSession = () => {
    setMessages([{ role: 'system', content: 'How can I help you?' }]);
    setIsQueryProcessing(false);
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    localStorage.setItem('chatSessionId', newSessionId);
    console.log('Started new session with ID:', newSessionId);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, []);

  // Start timer function
  const startTimer = useCallback(() => {
    // Clear any existing timer first
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Reset timer states
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    
    // Start timer interval
    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);
  }, []);

  // Stop timer and save final time
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Calculate and save final processing time
    if (startTimeRef.current) {
      const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setProcessingTime(finalTime);
      
      // For debugging - to verify the time is being captured
      console.log('Processing completed in:', finalTime, 'seconds');
      
      // Keep elapsed time updated too for consistency
      setElapsedTime(finalTime);
    }
  }, []);

  // After successful processing, hide the status message after a delay
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout | null = null;
    
    if (uploadStatus === 'success') {
      hideTimeout = setTimeout(() => {
        setUploadStatus('idle');
      }, 5000); // Hide after 5 seconds
    }
    
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [uploadStatus]);

  // Function to process file upload
  const processFile = useCallback(async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setUploadStatus('processing');
      setStatusMessage('Uploading document...');
      setUploadProgress(0);
      startTimer();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('chunk_size', chunkSize.toString());
      formData.append('chunk_overlap', chunkOverlap.toString());

      const response = await fetch(`${API_BASE}/rag/document`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload document');
      }

      const data: PdfUploadResponse = await response.json();
      
      if (data.success) {
        stopTimer(); // Stop timer before setting status
        setUploadStatus('success');
        setStatusMessage(`Successfully processed document. Created ${data.chunk_count} chunks.`);
      } else {
        stopTimer(); // Stop timer before setting status
        setUploadStatus('error');
        setStatusMessage(data.message || 'Failed to process document');
      }
    } catch (err) {
      stopTimer(); // Stop timer before setting status
      setUploadStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setStatusMessage(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  }, [file, chunkSize, chunkOverlap, startTimer, stopTimer]);

  // Function to process URL
  const processUrl = useCallback(async () => {
    if (!url) return;

    try {
      setIsProcessing(true);
      setUploadStatus('processing');
      setStatusMessage('Processing URL...');
      setUploadProgress(0);
      startTimer();

      const response = await fetch(`${API_BASE}/rag/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          url,
          chunk_size: chunkSize,
          chunk_overlap: chunkOverlap,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process URL');
      }

      const data: UrlProcessResponse = await response.json();
      
      if (data.success) {
        stopTimer(); // Stop timer before setting status
        setUploadStatus('success');
        setStatusMessage(`Successfully processed URL. Created ${data.chunk_count} chunks.`);
      } else {
        stopTimer(); // Stop timer before setting status
        setUploadStatus('error');
        setStatusMessage(data.message || 'Failed to process URL');
      }
    } catch (err) {
      stopTimer(); // Stop timer before setting status
      setUploadStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setStatusMessage(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  }, [url, chunkSize, chunkOverlap, startTimer, stopTimer]);

  // Function to process image/PDF using OCR
  const processImage = useCallback(async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setUploadStatus('processing');
      setStatusMessage('Uploading and processing image with OCR...');
      setUploadProgress(0);
      startTimer();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('chunk_size', chunkSize.toString());
      formData.append('chunk_overlap', chunkOverlap.toString());

      const response = await fetch(`${API_BASE}/rag/image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process image');
      }

      const data: ImageProcessResponse = await response.json();
      
      if (data.success) {
        stopTimer(); // Stop timer before setting status
        setUploadStatus('success');
        setStatusMessage(`Successfully processed image with OCR. Created ${data.chunk_count} chunks.`);
      } else {
        stopTimer(); // Stop timer before setting status
        setUploadStatus('error');
        setStatusMessage(data.message || 'Failed to process image');
      }
    } catch (err) {
      stopTimer(); // Stop timer before setting status
      setUploadStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setStatusMessage(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  }, [file, chunkSize, chunkOverlap, startTimer, stopTimer]);

  // Function to send a chat message
  const sendMessage = useCallback(async (content: string, selectedModels: string[], temperature: number) => {
    try {
      // Don't send if already processing
      if (isQueryProcessing) {
        return;
      }

      setIsQueryProcessing(true);
      
      // Add the user message to the UI immediately
      setMessages(prev => [...prev, { role: 'user', content }]);
      
      // Start timing
      startTimeRef.current = Date.now();
      
      // Filter source types
      const filterSourcesObject = {
        pdf: sourceFilters.pdf,
        url: sourceFilters.url,
        youtube: sourceFilters.youtube,
        image: sourceFilters.image,
      };
      
      // Log current session ID for debugging
      console.log(`Using session ID for request: ${sessionId || 'none (new session will be created)'}`);
      
      // If only one model is selected, use streaming
      if (selectedModels.length === 1) {
        const model = selectedModels[0];
        
        try {
          // Fetch the streaming response
          const response = await fetch(`${API_BASE}/rag/query/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              query: content,
              model_name: model,
              temperature,
              filter_sources: filterSourcesObject,
              session_id: sessionId, // Include session ID if available
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Failed to get response from ${model}`);
          }

          // Get or update session ID from response headers
          const responseSessionId = response.headers.get('X-Session-ID');
          if (responseSessionId) {
            if (!sessionId || sessionId !== responseSessionId) {
              console.log(`Updating chat session: ${sessionId || 'none'} -> ${responseSessionId}`);
              setSessionId(responseSessionId);
              localStorage.setItem('chatSessionId', responseSessionId);
            }
          }

          if (!response.body) {
            throw new Error('No response body received from the server');
          }

          // Set up the stream reader
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulatedResponse = '';
          let isFirstChunk = true;

          // Process the stream chunks
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }
            
            // Decode this chunk
            const chunk = decoder.decode(value, { stream: true });
            accumulatedResponse += chunk;
            
            // For the first chunk, add a new assistant message
            // For subsequent chunks, update the existing message
            if (isFirstChunk) {
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `**${model}**:\n${accumulatedResponse}`
              }]);
              isFirstChunk = false;
            } else {
              // Update the last message (the assistant response)
              setMessages(prev => {
                const updatedMessages = [...prev];
                if (updatedMessages.length > 0) {
                  updatedMessages[updatedMessages.length - 1] = {
                    role: 'assistant',
                    content: `**${model}**:\n${accumulatedResponse}`
                  };
                }
                return updatedMessages;
              });
            }
          }

          // Add performance note if in development mode
          if (!import.meta.env.PROD) {
            setMessages(prev => {
              const updatedMessages = [...prev];
              if (updatedMessages.length > 0) {
                // Add the note about streaming being used only if it's not already there
                const lastContent = updatedMessages[updatedMessages.length - 1].content;
                if (!lastContent.includes('_Response delivered via streaming_')) {
                  updatedMessages[updatedMessages.length - 1].content = 
                    `${lastContent}\n\n_Response delivered via streaming_`;
                }
              }
              return updatedMessages;
            });
          }
          
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          setMessages(prev => {
            // Replace the placeholder message with an error
            const updatedMessages = [...prev];
            if (updatedMessages.length > 1 && updatedMessages[updatedMessages.length - 1].role === 'assistant') {
              updatedMessages[updatedMessages.length - 1] = {
                role: 'assistant',
                content: `**${model}**:\nError: ${errorMessage}`
              };
            } else {
              // If for some reason there's no placeholder, add a new message
              updatedMessages.push({
                role: 'assistant',
                content: `**${model}**:\nError: ${errorMessage}`
              });
            }
            return updatedMessages;
          });
        }
      } else {
        // Multiple models - use the existing batch approach with non-streaming
        // Track timing info for each model
        const modelTimings: Record<string, TimingInfo> = {};

        // Process for each selected model
        const modelResponses: Record<string, string> = {};
        
        // Parallel processing of all model requests
        await Promise.all(selectedModels.map(async (model) => {
          try {
            const response = await fetch(`${API_BASE}/rag/query`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                query: content,
                model_name: model,
                temperature,
                filter_sources: filterSourcesObject,
                session_id: sessionId, // Include session ID if available
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.detail || `Failed to get response from ${model}`);
            }

            const data: QueryResponse = await response.json();
            
            // Store or update session ID from response
            if (data.session_id && (!sessionId || sessionId !== data.session_id)) {
              setSessionId(data.session_id);
              localStorage.setItem('chatSessionId', data.session_id);
              console.log('New chat session established:', data.session_id);
            }
            
            if (data.success) {
              modelResponses[model] = data.answer;
              // Save timing info if available
              if (data.timing) {
                modelTimings[model] = data.timing;
              }
            } else {
              modelResponses[model] = `Error: Failed to get a response from ${model}`;
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            modelResponses[model] = `Error: ${errorMessage}`;
          }
        }));

        // Format all model responses into a single message, including timing info if available
        let combinedResponse = '';
        for (const model of selectedModels) {
          const modelResponse = modelResponses[model] || 'No response';
          const timingInfo = modelTimings[model]; // Get timing info for this model
          
          combinedResponse += `**${model}**:\n${modelResponse}\n`;
          
          // Add timing info if available and in development mode
          if (timingInfo && !import.meta.env.PROD) {
            combinedResponse += `\n_Performance: Total ${timingInfo.total.toFixed(2)}s (Retrieval: ${timingInfo.retrieval.toFixed(2)}s | LLM: ${timingInfo.llm_generation.toFixed(2)}s)_\n\n`;
          } else {
            combinedResponse += '\n\n';
          }
        }

        // Add the combined response to messages
        setMessages(prev => [...prev, { role: 'assistant', content: combinedResponse.trim() }]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${errorMessage}` 
      }]);
    } finally {
      setIsQueryProcessing(false);
    }
  }, [isQueryProcessing, sourceFilters, sessionId]);  // Add sessionId as dependency

  // Add upload method change handler
  const handleUploadMethodChange = useCallback((method: 'pdf' | 'url' | 'image') => {
    setUploadMethod(method);
    // Reset file/url when switching methods
    if (method === 'url') {
      setFile(null);
    } else {
      setUrl('');
    }
  }, []);

  // Function to handle form submission based on upload method
  const handleSubmit = useCallback(() => {
    if (uploadMethod === 'pdf') {
      processFile();
    } else if (uploadMethod === 'url') {
      processUrl();
    } else if (uploadMethod === 'image') {
      processImage();
    }
  }, [uploadMethod, processFile, processUrl, processImage]);

  return {
    file,
    handleFileChange,
    url,
    handleUrlChange,
    isProcessing,
    isQueryProcessing,
    uploadStatus,
    messages,
    uploadProgress,
    statusMessage,
    elapsedTime: uploadStatus === 'processing' ? elapsedTime : processingTime,
    uploadMethod,
    handleUploadMethodChange,
    sourceFilters,
    setSourceFilters,
    processFile,
    processUrl,
    processImage,
    handleSubmit,
    sendMessage,
    reset,
    clearConversation,
    startNewSession,
    sessionId,  // Return session ID to component
    availableModels: [] as string[],
  };
} 