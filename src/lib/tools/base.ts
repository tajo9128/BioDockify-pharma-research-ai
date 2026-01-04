/**
 * Base Tool Interface for BioDockify v2.0.0
 *
 * All tools must implement this interface to be registered
 * with the tool registry and used by Agent Zero.
 */

export interface ToolInput {
  goal?: string
  stage?: 'early' | 'middle' | 'late'
  [key: string]: any
}

export interface ToolOutput {
  success: boolean
  data?: any
  error?: string
  metadata?: Record<string, any>
}

export interface ToolConfig {
  name: string
  description: string
  category: 'literature' | 'analysis' | 'generation' | 'export' | 'utilities'
  version: string
  requiredParams?: string[]
  optionalParams?: string[]
}

export abstract class BaseTool {
  public abstract readonly config: ToolConfig

  /**
   * Execute the tool with given input
   */
  abstract execute(input: ToolInput): Promise<ToolOutput>

  /**
   * Validate input before execution
   */
  validate(input: ToolInput): { valid: boolean; error?: string } {
    if (!input) {
      return { valid: false, error: 'Input is required' }
    }

    if (this.config.requiredParams) {
      for (const param of this.config.requiredParams) {
        if (!(param in input) || input[param] === undefined || input[param] === null) {
          return { valid: false, error: `Missing required parameter: ${param}` }
        }
      }
    }

    return { valid: true }
  }

  /**
   * Get tool metadata
   */
  getMetadata() {
    return {
      name: this.config.name,
      description: this.config.description,
      category: this.config.category,
      version: this.config.version,
      requiredParams: this.config.requiredParams || [],
      optionalParams: this.config.optionalParams || []
    }
  }

  /**
   * Create error output
   */
  protected error(message: string, metadata?: Record<string, any>): ToolOutput {
    return {
      success: false,
      error: message,
      metadata
    }
  }

  /**
   * Create success output
   */
  protected success(data: any, metadata?: Record<string, any>): ToolOutput {
    return {
      success: true,
      data,
      metadata
    }
  }
}
