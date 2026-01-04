/**
 * Persistent Memory Module for BioDockify v2.0.0
 *
 * Handles storage and retrieval of research data, task results,
 * and PhD progress tracking across sessions.
 */

import { db } from '@/lib/db'

export interface MemoryEntry {
  id: string
  taskId?: string
  type: 'goal' | 'result' | 'task' | 'thinking' | 'progress'
  goal?: string
  stage?: 'early' | 'middle' | 'late'
  data?: any
  result?: any
  timestamp: Date
  metadata?: Record<string, any>
}

export interface PhDProgress {
  id: string
  userId?: string
  overallProgress: number
  stages: {
    early: { completed: number; total: number; percentage: number }
    middle: { completed: number; total: number; percentage: number }
    late: { completed: number; total: number; percentage: number }
  }
  milestones: Milestone[]
  lastUpdated: Date
}

export interface Milestone {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  completedAt?: Date
  dependencies?: string[]
}

class PersistentMemory implements MemoryStore {
  private cache: Map<string, MemoryEntry>
  private progressCache: PhDProgress | null

  constructor() {
    this.cache = new Map()
    this.progressCache = null
  }

  /**
   * Store a memory entry
   */
  async store(entry: Partial<MemoryEntry>): Promise<string> {
    const id = entry.id || crypto.randomUUID()
    const memoryEntry: MemoryEntry = {
      id,
      taskId: entry.taskId,
      type: entry.type || 'result',
      goal: entry.goal,
      stage: entry.stage,
      data: entry.data,
      result: entry.result,
      timestamp: entry.timestamp || new Date(),
      metadata: entry.metadata
    }

    // Store in cache
    this.cache.set(id, memoryEntry)

    // Store in database (if applicable)
    try {
      await db.phdProgress.create({
        data: {
          id,
          stage: memoryEntry.stage || 'early',
          progress: 0,
          milestones: [],
          metadata: memoryEntry
        }
      })
    } catch (error) {
      // Fallback to in-memory only if DB fails
      console.warn('Database storage failed, using in-memory:', error)
    }

    return id
  }

  /**
   * Retrieve memory entries by query
   */
  async retrieve(query: any): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = []

    // Filter cache entries
    for (const entry of this.cache.values()) {
      let match = true

      if (query.type && entry.type !== query.type) {
        match = false
      }

      if (query.taskId && entry.taskId !== query.taskId) {
        match = false
      }

      if (query.goal && entry.goal !== query.goal) {
        match = false
      }

      if (query.stage && entry.stage !== query.stage) {
        match = false
      }

      if (query.startTime && entry.timestamp < query.startTime) {
        match = false
      }

      if (query.endTime && entry.timestamp > query.endTime) {
        match = false
      }

      if (match) {
        results.push(entry)
      }
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return results
  }

  /**
   * Get a specific memory entry by ID
   */
  async get(id: string): Promise<MemoryEntry | null> {
    return this.cache.get(id) || null
  }

  /**
   * Store goal result
   */
  async storeGoalResult(
    taskId: string,
    goal: string,
    stage: 'early' | 'middle' | 'late',
    result: any
  ): Promise<string> {
    return this.store({
      taskId,
      type: 'goal',
      goal,
      stage,
      result,
      timestamp: new Date(),
      metadata: {
        resultCount: Array.isArray(result) ? result.length : 1,
        resultType: Array.isArray(result) ? 'array' : typeof result
      }
    })
  }

  /**
   * Store thinking step
   */
  async storeThinkingStep(taskId: string, step: any): Promise<string> {
    return this.store({
      taskId,
      type: 'thinking',
      data: step,
      timestamp: new Date(),
      metadata: {
        stepType: step.type,
        tool: step.tool
      }
    })
  }

  /**
   * Get goal results
   */
  async getGoalResults(taskId: string): Promise<MemoryEntry[]> {
    return this.retrieve({
      taskId,
      type: 'goal'
    })
  }

  /**
   * Get thinking history
   */
  async getThinkingHistory(taskId: string): Promise<MemoryEntry[]> {
    return this.retrieve({
      taskId,
      type: 'thinking'
    })
  }

  /**
   * Update PhD progress
   */
  async updateProgress(stage: 'early' | 'middle' | 'late', completedTasks: number, totalTasks: number): Promise<void> {
    const now = new Date()

    if (!this.progressCache) {
      this.progressCache = this.initializeProgress()
    }

    // Update stage progress
    this.progressCache.stages[stage] = {
      completed: completedTasks,
      total: totalTasks,
      percentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    }

    // Calculate overall progress
    const allStages = Object.values(this.progressCache.stages)
    const totalPercentage = allStages.reduce((sum, stage) => sum + stage.percentage, 0)
    this.progressCache.overallProgress = totalPercentage / allStages.length

    this.progressCache.lastUpdated = now

    // Store to database
    try {
      await db.phdProgress.update({
        where: { id: 'overall-progress' },
        data: {
          stage,
          progress: this.progressCache.overallProgress,
          milestones: this.progressCache.milestones as any,
          metadata: this.progressCache as any
        }
      })
    } catch (error) {
      console.warn('Failed to update progress in database:', error)
    }
  }

  /**
   * Get PhD progress
   */
  async getProgress(): Promise<PhDProgress> {
    if (!this.progressCache) {
      this.progressCache = this.initializeProgress()
    }

    // Try to load from database
    try {
      const dbProgress = await db.phdProgress.findUnique({
        where: { id: 'overall-progress' }
      })

      if (dbProgress) {
        this.progressCache = dbProgress.metadata as PhDProgress || this.progressCache
      }
    } catch (error) {
      console.warn('Failed to load progress from database:', error)
    }

    return this.progressCache
  }

  /**
   * Add milestone
   */
  async addMilestone(milestone: Omit<Milestone, 'id'>): Promise<void> {
    if (!this.progressCache) {
      this.progressCache = this.initializeProgress()
    }

    const newMilestone: Milestone = {
      ...milestone,
      id: crypto.randomUUID()
    }

    this.progressCache.milestones.push(newMilestone)
    this.progressCache.lastUpdated = new Date()

    // Store to database
    try {
      await db.phdProgress.update({
        where: { id: 'overall-progress' },
        data: {
          milestones: this.progressCache.milestones as any,
          metadata: this.progressCache as any
        }
      })
    } catch (error) {
      console.warn('Failed to update milestone in database:', error)
    }
  }

  /**
   * Complete milestone
   */
  async completeMilestone(milestoneId: string): Promise<void> {
    if (!this.progressCache) {
      this.progressCache = await this.getProgress()
    }

    const milestone = this.progressCache.milestones.find(m => m.id === milestoneId)
    if (milestone) {
      milestone.status = 'completed'
      milestone.completedAt = new Date()
      this.progressCache.lastUpdated = new Date()

      // Store to database
      try {
        await db.phdProgress.update({
          where: { id: 'overall-progress' },
          data: {
            milestones: this.progressCache.milestones as any,
            metadata: this.progressCache as any
          }
        })
      } catch (error) {
        console.warn('Failed to update milestone in database:', error)
      }
    }
  }

  /**
   * Clear old memory entries
   */
  async clearOldEntries(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    let clearedCount = 0

    for (const [id, entry] of this.cache.entries()) {
      if (entry.timestamp < cutoffDate) {
        this.cache.delete(id)
        clearedCount++
      }
    }

    return clearedCount
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<{
    totalEntries: number
    entriesByType: Record<string, number>
    oldestEntry: Date | null
    newestEntry: Date | null
  }> {
    const entries = Array.from(this.cache.values())

    const stats = {
      totalEntries: entries.length,
      entriesByType: {} as Record<string, number>,
      oldestEntry: null as Date | null,
      newestEntry: null as Date | null
    }

    for (const entry of entries) {
      // Count by type
      stats.entriesByType[entry.type] = (stats.entriesByType[entry.type] || 0) + 1

      // Track timestamps
      if (!stats.oldestEntry || entry.timestamp < stats.oldestEntry) {
        stats.oldestEntry = entry.timestamp
      }
      if (!stats.newestEntry || entry.timestamp > stats.newestEntry) {
        stats.newestEntry = entry.timestamp
      }
    }

    return stats
  }

  /**
   * Initialize default progress structure
   */
  private initializeProgress(): PhDProgress {
    return {
      id: 'overall-progress',
      overallProgress: 0,
      stages: {
        early: { completed: 0, total: 0, percentage: 0 },
        middle: { completed: 0, total: 0, percentage: 0 },
        late: { completed: 0, total: 0, percentage: 0 }
      },
      milestones: [
        {
          id: crypto.randomUUID(),
          title: 'Literature Review Complete',
          description: 'Complete initial literature review and analysis',
          status: 'pending'
        },
        {
          id: crypto.randomUUID(),
          title: 'Research Questions Defined',
          description: 'Define and refine research questions',
          status: 'pending'
        },
        {
          id: crypto.randomUUID(),
          title: 'Methodology Established',
          description: 'Establish research methodology',
          status: 'pending'
        },
        {
          id: crypto.randomUUID(),
          title: 'Data Collection Complete',
          description: 'Complete data collection and processing',
          status: 'pending'
        },
        {
          id: crypto.randomUUID(),
          title: 'Analysis Complete',
          description: 'Complete data analysis',
          status: 'pending'
        },
        {
          id: crypto.randomUUID(),
          title: 'Thesis Draft Ready',
          description: 'Complete first draft of thesis',
          status: 'pending'
        }
      ],
      lastUpdated: new Date()
    }
  }
}

// Singleton instance
let memoryInstance: PersistentMemory | null = null

export function getPersistentMemory(): PersistentMemory {
  if (!memoryInstance) {
    memoryInstance = new PersistentMemory()
  }
  return memoryInstance
}

export type { MemoryStore }
