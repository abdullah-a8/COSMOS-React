import { ModelInfo } from '../types/models';


export const models: Record<string, ModelInfo> = {
  "llama-3.3-70b-versatile": {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    description: "Meta's versatile large language model with 128K context window and excellent reasoning capabilities. Recommended for production use.",
    contextWindow: 128000,
    isDefault: true,
    speed: "Fast",
    reasoning: "Excellent",
    math: "Excellent",
    coding: "Very Good",
    throughput: "High",
    cost: "Medium",
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: 100000,
    advantages: "Versatile model optimized for high accuracy in diverse scenarios.",
    disadvantages: "Lower throughput compared to some smaller models."
  },
  "llama-3.1-8b-instant": {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B",
    description: "Meta's smaller but powerful model with 128K context window. Ideal for rapid prototyping and cost-effective deployments.",
    contextWindow: 128000,
    isDefault: false,
    speed: "Very Fast",
    reasoning: "Good",
    math: "Good",
    coding: "Good",
    throughput: "Very High",
    cost: "Very Low",
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 20000,
    tokensPerDay: 500000,
    advantages: "High-speed processing with large token capacity, great for real-time applications.",
    disadvantages: "Less accurate for complex reasoning tasks compared to larger models."
  },
  "gemma2-9b-it": {
    id: "gemma2-9b-it",
    name: "Gemma 2 9B",
    description: "Google's instruction-tuned general-purpose model that excels at reasoning and helpfulness with 8K context window.",
    contextWindow: 8192,
    isDefault: false,
    speed: "Very Fast",
    reasoning: "Very Good",
    math: "Good",
    coding: "Good",
    throughput: "High",
    cost: "Low",
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 15000,
    tokensPerDay: 500000,
    advantages: "Higher token throughput, suitable for large-scale, fast inference.",
    disadvantages: "Limited versatility compared to larger LLaMA3 models."
  },
  "llama3-70b-8192": {
    id: "llama3-70b-8192",
    name: "Llama 3 70B",
    description: "Meta's large language model with 8K context window, offering strong performance across a wide range of tasks.",
    contextWindow: 8192,
    isDefault: false,
    speed: "Fast",
    reasoning: "Very Good",
    math: "Very Good",
    coding: "Very Good",
    throughput: "Medium",
    cost: "Medium",
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 6000,
    tokensPerDay: 500000,
    advantages: "Long-context capabilities, ideal for handling detailed research papers and articles.",
    disadvantages: "Moderate speed and accuracy for shorter tasks."
  },
  "llama3-8b-8192": {
    id: "llama3-8b-8192",
    name: "Llama 3 8B",
    description: "Meta's compact model with 8K context window, balancing performance and efficiency.",
    contextWindow: 8192,
    isDefault: false,
    speed: "Very Fast",
    reasoning: "Good",
    math: "Good",
    coding: "Good",
    throughput: "High",
    cost: "Low",
    requestsPerMinute: 30,
    requestsPerDay: 14400,
    tokensPerMinute: 20000,
    tokensPerDay: 500000,
    advantages: "Supports high-speed inference with long-context support.",
    disadvantages: "Slightly less accurate for complex reasoning compared to larger models."
  },
  "meta-llama/llama-4-maverick-17b-128e-instruct": {
    id: "meta-llama/llama-4-maverick-17b-128e-instruct",
    name: "Llama 4 Maverick",
    description: "PREVIEW: Meta's advanced model with Mixture of Experts (MoE) architecture (17Bx128E). Superior for multilingual and multimodal tasks.",
    contextWindow: 131072,
    isDefault: false,
    speed: "Fast",
    reasoning: "Excellent",
    math: "Excellent",
    coding: "Excellent",
    throughput: "Medium",
    cost: "Medium-High",
    requestsPerMinute: 20,
    requestsPerDay: 1000,
    tokensPerMinute: 5000,
    tokensPerDay: 100000,
    advantages: "State-of-the-art model with exceptional reasoning and multimodal capabilities.",
    disadvantages: "Preview model that may be subject to change or discontinuation."
  },
  "meta-llama/llama-4-scout-17b-16e-instruct": {
    id: "meta-llama/llama-4-scout-17b-16e-instruct",
    name: "Llama 4 Scout",
    description: "PREVIEW: Meta's high-speed model with MoE architecture (17Bx16E). Excellent for summarization, reasoning, and code.",
    contextWindow: 131072,
    isDefault: false,
    speed: "Very Fast",
    reasoning: "Very Good",
    math: "Very Good",
    coding: "Very Good",
    throughput: "Very High",
    cost: "Medium",
    requestsPerMinute: 30,
    requestsPerDay: 5000,
    tokensPerMinute: 25000,
    tokensPerDay: 300000,
    advantages: "Extremely high throughput with strong performance across diverse tasks.",
    disadvantages: "Preview model that may be subject to change or discontinuation."
  },
  "deepseek-r1-distill-llama-70b": {
    id: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1",
    description: "PREVIEW: DeepSeek's powerful distilled model with 128K context window. Excellent for reasoning, math, and coding tasks.",
    contextWindow: 128000,
    isDefault: false,
    speed: "Fast",
    reasoning: "Excellent",
    math: "Excellent",
    coding: "Excellent",
    throughput: "High",
    cost: "Medium",
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 6000,
    tokensPerDay: undefined,
    advantages: "Highly optimized for low latency with virtually unlimited token capacity, making it ideal for large-scale deployments.",
    disadvantages: "Limited daily requests compared to other models and preview status."
  }
};

export const getDefaultModel = (): ModelInfo => {
  const defaultModelEntry = Object.entries(models).find(([_, model]) => model.isDefault);
  if (!defaultModelEntry) {
    throw new Error('No default model found');
  }
  return defaultModelEntry[1];
};

export const getModelById = (id: string): ModelInfo | undefined => {
  return models[id];
};

// Format model name for display (removes meta-llama/ prefix)
export const formatModelNameForDisplay = (modelId: string): string => {
  return modelId.replace('meta-llama/', '');
};
