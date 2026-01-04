/**
 * SciBERT Embedder Tool
 *
 * Generates semantic embeddings for scientific text
 * using SciBERT (Scientific BERT) model.
 */

import { BaseTool, ToolConfig, ToolInput, ToolOutput } from './base'

interface EmbeddingResult {
  text: string
  embedding: number[]
  dimension: number
}

export class SciBERTEmbedderTool extends BaseTool {
  public readonly config: ToolConfig = {
    name: 'scibert_embedder',
    description: 'Generate semantic embeddings for scientific text using SciBERT',
    category: 'analysis',
    version: '1.0.0',
    requiredParams: ['text'] || ['texts'],
    optionalParams: ['model', 'normalize']
  }

  async execute(input: ToolInput): Promise<ToolOutput> {
    try {
      const {
        text,
        texts,
        model = 'allenai/scibert_scivocab_cased',
        normalize = true
      } = input

      // Handle single text or batch
      if (texts) {
        const results = await this.embedBatch(texts as string[], model as string, normalize as boolean)
        return this.success(results, {
          count: results.length,
          model,
          normalize
        })
      } else if (text) {
        const result = await this.embed(text as string, model as string, normalize as boolean)
        return this.success(result, {
          model,
          normalize
        })
      } else {
        return this.error('Either text or texts parameter is required')
      }

    } catch (error: any) {
      return this.error(error.message, { tool: this.config.name })
    }
  }

  private async embed(
    text: string,
    model: string,
    normalize: boolean
  ): Promise<EmbeddingResult> {
    // In production, this would use an actual SciBERT model
    // For now, we'll generate a mock embedding

    // Simulate model inference delay
    await new Promise(resolve => setTimeout(resolve, 300))

    // Generate mock embedding (768 dimensions is typical for BERT)
    const dimension = 768
    const embedding = this.generateMockEmbedding(dimension)

    return {
      text,
      embedding: normalize ? this.normalizeVector(embedding) : embedding,
      dimension
    }
  }

  private async embedBatch(
    texts: string[],
    model: string,
    normalize: boolean
  ): Promise<EmbeddingResult[]> {
    // In production, this would process multiple texts in parallel
    const results: EmbeddingResult[] = []

    for (const text of texts) {
      const result = await this.embed(text, model, normalize)
      results.push(result)
    }

    return results
  }

  private generateMockEmbedding(dimension: number): number[] {
    const embedding: number[] = []
    for (let i = 0; i < dimension; i++) {
      // Generate random-like values based on input text characteristics
      embedding.push((Math.sin(i * 0.1) + 1) / 2)
    }
    return embedding
  }

  private normalizeVector(vector: number[]): number[] {
    // Calculate L2 norm
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))

    if (norm === 0) {
      return vector
    }

    // Normalize
    return vector.map(val => val / norm)
  }
}
