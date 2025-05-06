export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  isDefault: boolean;
  speed: string;
  reasoning: string;
  math: string;
  coding: string;
  throughput: string;
  cost: string;
  requestsPerMinute?: number;
  requestsPerDay?: number;
  tokensPerMinute?: number;
  tokensPerDay?: number;
  advantages?: string;
  disadvantages?: string;
}
