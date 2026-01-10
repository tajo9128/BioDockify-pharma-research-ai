import { ProjectMemory, CoreContext, KnowledgeEntry, DecisionEntry } from './types';
import { v4 as uuidv4 } from 'uuid';

const MEMORY_KEY_PREFIX = 'agent_zero_memory_';

export class MemoryManager {
    private activeProjectId: string | null = null;
    private memoryCache: ProjectMemory | null = null;

    /**
     * Loads the memory for a specific project.
     * Currently uses LocalStorage for persistence.
     */
    public loadProject(projectId: string): ProjectMemory | null {
        this.activeProjectId = projectId;
        const raw = localStorage.getItem(`${MEMORY_KEY_PREFIX}${projectId}`);
        if (raw) {
            this.memoryCache = JSON.parse(raw);
            return this.memoryCache;
        }
        return null;
    }

    public createProject(title: string, description: string, personaId: string): ProjectMemory {
        const id = uuidv4();
        const memory: ProjectMemory = {
            core: {
                projectId: id,
                projectTitle: title,
                description,
                startDate: new Date().toISOString(),
                researchStage: 'exploration',
                activePersonaId: personaId,
                constraints: []
            },
            knowledge: [],
            decisions: [],
            interactions: []
        };

        this.saveProject(memory);
        this.activeProjectId = id;
        this.memoryCache = memory;
        return memory;
    }

    public saveProject(memory: ProjectMemory) {
        if (!memory.core.projectId) return;
        localStorage.setItem(`${MEMORY_KEY_PREFIX}${memory.core.projectId}`, JSON.stringify(memory));
        this.memoryCache = memory;
    }

    public addKnowledge(finding: string, source: string, confidence: 'high' | 'medium' | 'low') {
        if (!this.memoryCache) return;
        const entry: KnowledgeEntry = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            finding,
            source,
            confidence,
            tags: []
        };
        this.memoryCache.knowledge.push(entry);
        this.saveProject(this.memoryCache);
    }

    public addDecision(decision: string, reasoning: string, approved: boolean) {
        if (!this.memoryCache) return;
        const entry: DecisionEntry = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            decision,
            reasoning,
            alternatives_rejected: [],
            user_approved: approved
        };
        this.memoryCache.decisions.push(entry);
        this.saveProject(this.memoryCache);
    }

    public getActiveMemory(): ProjectMemory | null {
        return this.memoryCache;
    }
}

export const memoryManager = new MemoryManager();
