import { supabase } from './supabase';

interface RateLimitOptions {
  functionName: string;
  userId?: string;
  ipAddress?: string;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
  violationType?: string;
}

interface UsageTrackingData {
  functionName: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  requestSizeBytes?: number;
  responseSizeBytes?: number;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  costData?: {
    provider: string;
    operation: string;
    inputTokens?: number;
    outputTokens?: number;
    costPerUnit?: number;
    totalCost?: number;
  };
}

export class ApiRateLimiter {
  private static instance: ApiRateLimiter;

  private constructor() {}

  static getInstance(): ApiRateLimiter {
    if (!ApiRateLimiter.instance) {
      ApiRateLimiter.instance = new ApiRateLimiter();
    }
    return ApiRateLimiter.instance;
  }

  async checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = options.userId || user?.id;

      if (!userId) {
        return {
          allowed: true,
          limit: 60,
          remaining: 60,
          resetAt: new Date(Date.now() + 60000).toISOString()
        };
      }

      const { data, error } = await supabase.functions.invoke('api-rate-limiter', {
        body: {
          userId,
          functionName: options.functionName,
          ipAddress: options.ipAddress
        }
      });

      if (error) {
        console.error('Rate limit check error:', error);
        // Allow request on error to avoid blocking users
        return {
          allowed: true,
          limit: 60,
          remaining: 60,
          resetAt: new Date(Date.now() + 60000).toISOString()
        };
      }

      return data as RateLimitResult;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return {
        allowed: true,
        limit: 60,
        remaining: 60,
        resetAt: new Date(Date.now() + 60000).toISOString()
      };
    }
  }

  async trackUsage(data: UsageTrackingData): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (!userId) return;

      const trackingData = {
        ...data,
        userId,
        ipAddress: data.ipAddress || this.getClientIp(),
        userAgent: data.userAgent || navigator.userAgent
      };

      await supabase.functions.invoke('track-api-usage', {
        body: trackingData
      });
    } catch (error) {
      console.error('Usage tracking error:', error);
    }
  }

  async wrapApiCall<T>(
    functionName: string,
    endpoint: string,
    method: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let statusCode = 200;
    let errorMessage: string | undefined;

    try {
      // Check rate limit
      const rateLimitResult = await this.checkRateLimit({ functionName });
      
      if (!rateLimitResult.allowed) {
        statusCode = 429;
        throw new Error(`Rate limit exceeded. Try again at ${rateLimitResult.resetAt}`);
      }

      // Make the API call
      const result = await apiCall();

      return result;
    } catch (error) {
      statusCode = error.status || 500;
      errorMessage = error.message;
      throw error;
    } finally {
      // Track usage
      const responseTimeMs = Date.now() - startTime;
      await this.trackUsage({
        functionName,
        endpoint,
        method,
        statusCode,
        responseTimeMs,
        errorMessage
      });
    }
  }

  private getClientIp(): string {
    // In a real implementation, this would get the actual client IP
    // For now, return a placeholder
    return '0.0.0.0';
  }

  // Helper method to calculate API costs
  calculateOpenAICost(inputTokens: number, outputTokens: number, model: string = 'gpt-4'): number {
    const costs = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1k tokens
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'gpt-4-vision': { input: 0.01, output: 0.03 }
    };

    const modelCost = costs[model] || costs['gpt-4'];
    return (inputTokens * modelCost.input / 1000) + (outputTokens * modelCost.output / 1000);
  }
}

export const apiRateLimiter = ApiRateLimiter.getInstance();