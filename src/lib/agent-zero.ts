/**
 * Agent Zero - Core Orchestrator for BioDockify v2.0.0
 *
 * Agent Zero is the central AI agent that orchestrates research workflows
 * by coordinating tools, managing persistent memory, and executing goals
 * across different PhD research stages.
 */

export interface Tool {
  name: string
  description: string
  category: string
  execute(input: any): Promise<any>
  validate?(input: any): boolean
}

export interface MemoryStore {
  store(data: any): Promise<void>
  retrieve(query: any): Promise<any[]>
  get(id: string): Promise<any>
}

export interface ThinkingStep {
  type: 'decomposition' | 'tool_selection' | 'execution' | 'validation' | 'analysis'
  description: string
  timestamp: string
  tool?: string
  metadata?: Record<string, any>
}

export interface GoalContext {
  id: string
  goal: string
  stage: 'early' | 'middle' | 'late'
  createdAt: Date
  tasks: Task[]
  results: any[]
}

export interface Task {
  id: string
  description: string
  tool?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: any
  error?: string
  dependencies: string[]
}

export class AgentZero {
  private tools: Map<string, Tool>
  private memory: MemoryStore
  private thinkingLog: ThinkingStep[]
  private listeners: Map<string, (step: ThinkingStep) => void>

  constructor(tools: Map<string, Tool>, memory: MemoryStore) {
    this.tools = tools
    this.memory = memory
    this.thinkingLog = []
    this.listeners = new Map()
  }

  /**
   * Execute a research goal through the agent's orchestration engine
   */
  async executeGoal(goal: string, stage: 'early' | 'middle' | 'late' = 'early'): Promise<GoalContext> {
    const contextId = crypto.randomUUID()

    const context: GoalContext = {
      id: contextId,
      goal,
      stage,
      createdAt: new Date(),
      tasks: [],
      results: []
    }

    try {
      // Step 1: Decompose goal into tasks
      this.logThinking({
        type: 'decomposition',
        description: 'Breaking down goal into tasks...',
        timestamp: new Date().toISOString()
      })

      const tasks = await this.decomposeGoal(goal, stage)
      context.tasks = tasks

      // Step 2: Plan task execution order
      this.logThinking({
        type: 'decomposition',
        description: `Identified ${tasks.length} sub-tasks to execute`,
        timestamp: new Date().toISOString()
      })

      // Step 3: Execute tasks sequentially with dependencies
      for (const task of tasks) {
        await this.executeTask(task, context)
      }

      // Step 4: Aggregate results
      this.logThinking({
        type: 'validation',
        description: 'Aggregating and validating results...',
        timestamp: new Date().toISOString()
      })

      context.results = tasks
        .filter(t => t.status === 'completed' && t.result)
        .map(t => t.result)

      // Step 5: Store in persistent memory
      await this.memory.store({
        contextId,
        goal,
        stage,
        tasks: context.tasks,
        results: context.results,
        completedAt: new Date()
      })

      this.logThinking({
        type: 'validation',
        description: `Goal execution completed with ${context.results.length} results`,
        timestamp: new Date().toISOString()
      })

      return context

    } catch (error: any) {
      this.logThinking({
        type: 'validation',
        description: `Error executing goal: ${error.message}`,
        timestamp: new Date().toISOString(),
        metadata: { error: error.stack }
      })

      throw error
    }
  }

  /**
   * Decompose a high-level goal into executable tasks based on research stage
   */
  private async decomposeGoal(goal: string, stage: 'early' | 'middle' | 'late'): Promise<Task[]> {
    const tasks: Task[] = []

    // Stage-specific task decomposition
    if (stage === 'early') {
      tasks.push(
        {
          id: crypto.randomUUID(),
          description: 'Search relevant literature',
          tool: 'pubmed_search',
          status: 'pending',
          dependencies: []
        },
        {
          id: crypto.randomUUID(),
          description: 'Parse PDF documents',
          tool: 'grobid_parser',
          status: 'pending',
          dependencies: [tasks[0].id]
        },
        {
          id: crypto.randomUUID(),
          description: 'Generate embeddings for semantic search',
          tool: 'scibert_embedder',
          status: 'pending',
          dependencies: [tasks[1].id]
        },
        {
          id: crypto.randomUUID(),
          description: 'Extract research themes and topics',
          tool: 'bertopic_theme',
          status: 'pending',
          dependencies: [tasks[2].id]
        }
      )
    } else if (stage === 'middle') {
      tasks.push(
        {
          id: crypto.randomUUID(),
          description: 'Analyze existing results',
          tool: 'pubmed_search',
          status: 'pending',
          dependencies: []
        },
        {
          id: crypto.randomUUID(),
          description: 'Generate hypotheses',
          tool: 'llm_generate',
          status: 'pending',
          dependencies: [tasks[0].id]
        },
        {
          id: crypto.randomUUID(),
          description: 'Build knowledge graph connections',
          tool: 'neo4j_connector',
          status: 'pending',
          dependencies: [tasks[0].id]
        }
      )
    } else if (stage === 'late') {
      tasks.push(
        {
          id: crypto.randomUUID(),
          description: 'Synthesize findings',
          tool: 'llm_generate',
          status: 'pending',
          dependencies: []
        },
        {
          id: crypto.randomUUID(),
          description: 'Generate LaTeX thesis',
          tool: 'latex_generator',
          status: 'pending',
          dependencies: [tasks[0].id]
        },
        {
          id: crypto.randomUUID(),
          description: 'Generate DOCX report',
          tool: 'docx_generator',
          status: 'pending',
          dependencies: [tasks[0].id]
        }
      )
    }

    return tasks
  }

  /**
   * Execute a single task using the appropriate tool
   */
  private async executeTask(task: Task, context: GoalContext): Promise<void> {
    // Check dependencies
    const pendingDeps = task.dependencies.filter(depId => {
      const depTask = context.tasks.find(t => t.id === depId)
      return depTask?.status !== 'completed'
    })

    if (pendingDeps.length > 0) {
      task.status = 'failed'
      task.error = `Dependencies not met: ${pendingDeps.join(', ')}`
      return
    }

    // Skip if no tool specified
    if (!task.tool) {
      task.status = 'completed'
      return
    }

    // Get tool
    const tool = this.tools.get(task.tool)
    if (!tool) {
      task.status = 'failed'
      task.error = `Tool not found: ${task.tool}`
      return
    }

    // Execute tool
    task.status = 'running'

    this.logThinking({
      type: 'tool_selection',
      description: `Executing task: ${task.description}`,
      timestamp: new Date().toISOString(),
      tool: tool.name
    })

    try {
      const input = this.prepareToolInput(task, context)
      const result = await tool.execute(input)

      task.result = result
      task.status = 'completed'

      this.logThinking({
        type: 'execution',
        description: `Task completed: ${task.description}`,
        timestamp: new Date().toISOString(),
        tool: tool.name,
        metadata: { resultCount: Array.isArray(result) ? result.length : 1 }
      })

    } catch (error: any) {
      task.status = 'failed'
      task.error = error.message

      this.logThinking({
        type: 'validation',
        description: `Task failed: ${error.message}`,
        timestamp: new Date().toISOString(),
        tool: tool.name
      })
    }
  }

  /**
   * Prepare input for tool execution based on task and context
   */
  private prepareToolInput(task: Task, context: GoalContext): any {
    const input: any = {
      goal: context.goal,
      stage: context.stage
    }

    // Add results from dependency tasks
    if (task.dependencies.length > 0) {
      input.previousResults = task.dependencies.map(depId => {
        const depTask = context.tasks.find(t => t.id === depId)
        return depTask?.result
      }).filter(Boolean)
    }

    return input
  }

  /**
   * Log a thinking step for real-time streaming
   */
  private logThinking(step: ThinkingStep): void {
    this.thinkingLog.push(step)

    // Notify listeners
    this.listeners.forEach(callback => callback(step))
  }

  /**
   * Subscribe to thinking stream
   */
  onThinking(callback: (step: ThinkingStep) => void): string {
    const subscriptionId = crypto.randomUUID()
    this.listeners.set(subscriptionId, callback)
    return subscriptionId
  }

  /**
   * Unsubscribe from thinking stream
   */
  unsubscribe(subscriptionId: string): void {
    this.listeners.delete(subscriptionId)
  }

  /**
   * Get all available tools
   */
  listTools(): Tool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): Tool[] {
    return Array.from(this.tools.values()).filter(t => t.category === category)
  }

  /**
   * Get thinking history
   */
  getThinkingHistory(): ThinkingStep[] {
    return [...this.thinkingLog]
  }

  /**
   * Clear thinking history
   */
  clearThinkingHistory(): void {
    this.thinkingLog = []
  }
}
