export interface ModelInfo {
  requestsPerMinute: number;
  requestsPerDay: number | null;
  tokensPerMinute: number;
  tokensPerDay: number | null;
  advantages: string;
  disadvantages: string;
}

export const models: Record<string, ModelInfo> = {
  "deepseek-r1-distill-llama-70b": {
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: null, // Unlimited token capacity
    advantages: "Highly optimized for low latency with no token limits, making it ideal for large-scale deployments.",
    disadvantages: "Limited daily requests compared to other models.",
  },
  "qwen-2.5-32b": {
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 10000,
    tokensPerDay: 500000,
    advantages: "Powerful 32B model optimized for long-context comprehension and reasoning.",
    disadvantages: "Requires more computational resources.",
  },
  "gemma2-9b-it": {
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 15000,
    tokensPerDay: 500000,
    advantages: "Higher token throughput, suitable for large-scale, fast inference.",
    disadvantages: "Limited versatility compared to larger LLaMA3 models.",
  },
  "llama-3.1-8b-instant": {
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 20000,
    tokensPerDay: 500000,
    advantages: "High-speed processing with large token capacity, great for real-time applications.",
    disadvantages: "Less accurate for complex reasoning tasks compared to larger models.",
  },
  "llama-3.3-70b-versatile": {
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: 100000,
    advantages: "Versatile model optimized for high accuracy in diverse scenarios.",
    disadvantages: "Lower throughput compared to some smaller models.",
  },
  "llama3-70b-8192": {
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 6000,
    tokensPerDay: 500000,
    advantages: "Long-context capabilities, ideal for handling detailed research papers and articles.",
    disadvantages: "Moderate speed and accuracy for shorter tasks.",
  },
  "llama3-8b-8192": {
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 20000,
    tokensPerDay: 500000,
    advantages: "Supports high-speed inference with long-context support.",
    disadvantages: "Slightly less accurate for complex reasoning compared to larger models.",
  },
  "mistral-saba-24b": {
    requestsPerMinute: 30,
    requestsPerDay: 7000,
    tokensPerMinute: 7000,
    tokensPerDay: 250000,
    advantages: "Strong multi-turn conversation capabilities and effective retrieval augmentation.",
    disadvantages: "Limited token capacity compared to LLaMA-70B.",
  },
  "mixtral-8x7b-32768": {
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 5000,
    tokensPerDay: 500000,
    advantages: "Supports long document processing for better contextual understanding.",
    disadvantages: "Lower token throughput compared to some other models.",
  },
}; 