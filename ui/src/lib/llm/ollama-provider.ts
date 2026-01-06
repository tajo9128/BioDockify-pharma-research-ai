/**
 * Ollama Provider
 * Local LLM provider using Ollama API
 * https://github.com/ollama/ollama
 */

import { LLMProvider, Message, CompleteOptions, ChatOptions, LLMError, ProviderUnavailableError, TimeoutError } from './base-provider';

export class OllamaProvider implements LLMProvider {
  name = 'ollama';
  type = 'local' as const;

  private baseUrl: string;
  private timeout: number;
  private defaultModel: string;

  constructor(config: { baseUrl?: string; timeout?: number; defaultModel?: string } = {}) {
    this.baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.timeout = config.timeout || 120000; // 2 minutes
    this.defaultModel = config.defaultModel || 'llama2';
  }

  /**
   * Check if Ollama is available
   */
  async available(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout for availability check
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get list of available models
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new LLMError('Failed to fetch models from Ollama', this.name);
      }

      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      if (error instanceof LLMError) throw error;
      throw new LLMError(`Failed to get models: ${error}`, this.name);
    }
  }

  /**
   * Complete a single prompt
   */
  async complete(prompt: string, options: CompleteOptions = {}): Promise<string> {
    const model = options.model || this.defaultModel;

    try {
      const response = await Promise.race([
        fetch(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            stream: false,
            options: {
              temperature: options.temperature || 0.7,
              num_predict: options.maxTokens || 2048
            }
          })
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.timeout)
        )
      ]) as Promise<Response>;

      if (!response.ok) {
        const error = await response.text();
        throw new LLMError(`Ollama error: ${error}`, this.name);
      }

      const data = await response.json();
      return data.response || data.response || '';
    } catch (error) {
      if (error instanceof Error && error.message === 'Timeout') {
        throw new TimeoutError(this.name, this.timeout);
      }
      if (error instanceof LLMError) throw error;
      throw new LLMError(`Failed to complete: ${error}`, this.name);
    }
  }

  /**
   * Complete a chat conversation
   */
  async chat(messages: Message[], options: ChatOptions = {}): Promise<string> {
    const model = options.model || this.defaultModel;

    try {
      // Build conversation history
      let prompt = '';
      for (const message of messages) {
        if (message.role === 'system') {
          prompt += `System: ${message.content}\n\n`;
        } else if (message.role === 'user') {
          prompt += `User: ${message.content}\n\n`;
        } else if (message.role === 'assistant') {
          prompt += `Assistant: ${message.content}\n\n`;
        }
      }

      const response = await Promise.race([
        fetch(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            stream: false,
            options: {
              temperature: options.temperature || 0.7,
              num_predict: options.maxTokens || 2048
            }
          })
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.timeout)
        )
      ]) as Promise<Response>;

      if (!response.ok) {
        const error = await response.text();
        throw new LLMError(`Ollama error: ${error}`, this.name);
      }

      const data = await response.json();
      return data.response || '';
    } catch (error) {
      if (error instanceof Error && error.message === 'Timeout') {
        throw new TimeoutError(this.name, this.timeout);
      }
      if (error instanceof LLMError) throw error;
      throw new LLMError(`Failed to chat: ${error}`, this.name);
    }
  }

  /**
   * Get default model
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Set default model
   */
  setDefaultModel(model: string) {
    this.defaultModel = model;
  }
}

// Singleton instance
let ollamaInstance: OllamaProvider | null = null;

export function getOllamaProvider(): OllamaProvider {
  if (!ollamaInstance) {
    ollamaInstance = new OllamaProvider();
  }
  return ollamaInstance;
}
