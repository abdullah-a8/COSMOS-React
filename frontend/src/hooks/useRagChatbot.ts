import { useState, useCallback, useEffect, useRef } from 'react';

interface RagMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SourceFilters {
  pdf: boolean;
  url: boolean;
  youtube: boolean;
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
}

// API base URL
const API_BASE = import.meta.env.PROD ? '/api/v1' : 'http://localhost:8000/api/v1';

export function useRagChatbot(chunkSize: number, chunkOverlap: number) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>('');
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
  });
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Timer state management - simplified to match YouTube processor
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // URL change handler
  const handleUrlChange = useCallback((newUrl: string) => {
    setUrl(newUrl);
  }, []);

  // File change handler
  const handleFileChange = useCallback((newFile: File | null) => {
    setFile(newFile);
  }, []);

  // Reset function
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

  // Function to send a chat message
  const sendMessage = useCallback(async (content: string, selectedModels: string[], temperature: number) => {
    if (!content.trim() || isQueryProcessing) return;

    try {
      // Add user message
      setMessages(prev => [...prev, { role: 'user', content }]);
      setIsQueryProcessing(true);

      // Create filter object from sourceFilters
      const filterSourcesObject = {
        pdf: sourceFilters.pdf,
        url: sourceFilters.url,
        youtube: sourceFilters.youtube,
      };

      // If only one model is selected, use streaming
      if (selectedModels.length === 1) {
        const model = selectedModels[0];
        
        try {
          // Add placeholder assistant message that will be updated incrementally
          setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
          
          // Fetch the streaming response
          const response = await fetch(`${API_BASE}/rag/query/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: content,
              model_name: model,
              temperature,
              filter_sources: filterSourcesObject,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Failed to get response from ${model}`);
          }

          if (!response.body) {
            throw new Error('No response body received from the server');
          }

          // Set up the stream reader
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulatedResponse = '';

          // Process the stream chunks
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }
            
            // Decode this chunk
            const chunk = decoder.decode(value, { stream: true });
            accumulatedResponse += chunk;
            
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

          // Add performance note if in development mode
          if (!import.meta.env.PROD) {
            setMessages(prev => {
              const updatedMessages = [...prev];
              if (updatedMessages.length > 0) {
                // Add the note about streaming being used
                const lastContent = updatedMessages[updatedMessages.length - 1].content;
                updatedMessages[updatedMessages.length - 1].content = 
                  `${lastContent}\n\n_Response delivered via streaming_`;
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
              body: JSON.stringify({
                query: content,
                model_name: model,
                temperature,
                filter_sources: filterSourcesObject,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.detail || `Failed to get response from ${model}`);
            }

            const data: QueryResponse = await response.json();
            
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
  }, [isQueryProcessing, sourceFilters]);

  return {
    file,
    url,
    isProcessing,
    isQueryProcessing,
    uploadStatus,
    messages,
    sourceFilters,
    uploadProgress,
    statusMessage,
    elapsedTime: uploadStatus === 'processing' ? elapsedTime : processingTime,
    handleUrlChange,
    handleFileChange,
    processFile,
    processUrl,
    sendMessage,
    setSourceFilters,
    reset,
  };
} 