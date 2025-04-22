import type { ModelInfo } from "../types/models"

export const models: Record<string, ModelInfo> = {
  "gpt-4o": {
    requestsPerMinute: 500,
    requestsPerDay: 720000,
    tokensPerMinute: 300000,
    tokensPerDay: 432000000,
    advantages: "Best overall performance, strong reasoning, follows instructions well",
    disadvantages: "More expensive, can be slower than other models",
  },
  "gpt-3.5-turbo": {
    requestsPerMinute: 3500,
    requestsPerDay: 5040000,
    tokensPerMinute: 1000000,
    tokensPerDay: 1440000000,
    advantages: "Fast response time, cost-effective, good for simple tasks",
    disadvantages: "Less accurate than GPT-4, weaker reasoning capabilities",
  },
  "claude-3-opus": {
    requestsPerMinute: 300,
    requestsPerDay: 432000,
    tokensPerMinute: 250000,
    tokensPerDay: 360000000,
    advantages: "Excellent for long-form content, strong reasoning, good at following instructions",
    disadvantages: "Slower than some alternatives, higher cost than Claude Sonnet",
  },
  "claude-3-sonnet": {
    requestsPerMinute: 500,
    requestsPerDay: 720000,
    tokensPerMinute: 400000,
    tokensPerDay: 576000000,
    advantages: "Good balance of speed and quality, strong reasoning, cost-effective",
    disadvantages: "Less capable than Opus, can be verbose",
  },
  "llama3-70b-8192": {
    requestsPerMinute: 450,
    requestsPerDay: 648000,
    tokensPerMinute: 350000,
    tokensPerDay: 504000000,
    advantages: "Open weights model, strong general capabilities, good for code generation",
    disadvantages: "Less reliable than closed models, inconsistent performance on specialized tasks",
  },
  "mistral-large": {
    requestsPerMinute: 700,
    requestsPerDay: 1008000,
    tokensPerMinute: 500000,
    tokensPerDay: 720000000,
    advantages: "Fast inference, good performance for size, efficient token usage",
    disadvantages: "Less capable than larger models, limited context window",
  },
}
