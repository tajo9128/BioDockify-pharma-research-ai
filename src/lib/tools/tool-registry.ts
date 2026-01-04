/**
 * Tool Registry for BioDockify v2.0.0
 *
 * Manages registration, discovery, and execution of all tools
 * available to Agent Zero.
 */

import { BaseTool, ToolInput, ToolOutput } from './base'
import { PubMedSearchTool } from './pubmed-search'
import { GROBIDParserTool } from './grobid-parser'
import { SciBERTEmbedderTool } from './scibert-embedder'
import { BERTopicTool } from './bertopic-extractor'
import { Neo4jConnectorTool } from './neo4j-connector'
import { LLMGenerateTool } from './llm-generate'
import { LaTeXGeneratorTool } from './latex-generator'
import { DOCXGeneratorTool } from './docx-generator'

export class ToolRegistry {
  private tools: Map<string, BaseTool>
  private categories: Map<string, Set<string>>

  constructor() {
    this.tools = new Map()
    this.categories = new Map()
    this._registerDefaultTools()
  }

  /**
   * Register a tool
   */
  register(tool: BaseTool): void {
    const { name, category } = tool.config

    this.tools.set(name, tool)

    if (!this.categories.has(category)) {
      this.categories.set(category, new Set())
    }
    this.categories.get(category)!.add(name)
  }

  /**
   * Unregister a tool
   */
  unregister(name: string): void {
    const tool = this.tools.get(name)
    if (tool) {
      this.categories.get(tool.config.category)?.delete(name)
      this.tools.delete(name)
    }
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): BaseTool | null {
    return this.tools.get(name) || null
  }

  /**
   * Execute a tool
   */
  async executeTool(name: string, input: ToolInput): Promise<ToolOutput> {
    const tool = this.getTool(name)

    if (!tool) {
      return {
        success: false,
        error: `Tool '${name}' not found in registry`
      }
    }

    // Validate input
    const validation = tool.validate(input)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }

    try {
      return await tool.execute(input)
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Tool execution failed'
      }
    }
  }

  /**
   * List all tool names
   */
  listTools(): string[] {
    return Array.from(this.tools.keys())
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): BaseTool[] {
    const toolNames = this.categories.get(category)
    if (!toolNames) return []

    return Array.from(toolNames)
      .map(name => this.tools.get(name))
      .filter((tool): tool is BaseTool => tool !== undefined)
  }

  /**
   * List all categories
   */
  listCategories(): string[] {
    return Array.from(this.categories.keys())
  }

  /**
   * Get all tool metadata
   */
  getAllMetadata() {
    return Array.from(this.tools.values()).map(tool => tool.getMetadata())
  }

  /**
   * Search tools by keyword in name or description
   */
  searchTools(keyword: string): BaseTool[] {
    const lowerKeyword = keyword.toLowerCase()

    return Array.from(this.tools.values()).filter(tool => {
      const name = tool.config.name.toLowerCase()
      const description = tool.config.description.toLowerCase()
      return name.includes(lowerKeyword) || description.includes(lowerKeyword)
    })
  }

  /**
   * Get tool count by category
   */
  getCountByCategory(): Record<string, number> {
    const counts: Record<string, number> = {}

    for (const [category, tools] of this.categories.entries()) {
      counts[category] = tools.size
    }

    return counts
  }

  /**
   * Check if tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * Get total tool count
   */
  getTotalCount(): number {
    return this.tools.size
  }

  /**
   * Register default tools
   */
  private _registerDefaultTools(): void {
    // Literature tools
    this.register(new PubMedSearchTool())

    // Analysis tools
    this.register(new GROBIDParserTool())
    this.register(new SciBERTEmbedderTool())
    this.register(new BERTopicTool())
    this.register(new Neo4jConnectorTool())

    // Generation tools
    this.register(new LLMGenerateTool())

    // Export tools
    this.register(new LaTeXGeneratorTool())
    this.register(new DOCXGeneratorTool())
  }
}

// Singleton instance
let registry: ToolRegistry | null = null

export function getToolRegistry(): ToolRegistry {
  if (!registry) {
    registry = new ToolRegistry()
  }
  return registry
}

export function resetToolRegistry(): void {
  registry = null
}
