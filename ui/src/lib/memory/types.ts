export interface CoreContext {
    projectId: string;
    projectTitle: string;
    description: string;
    startDate: string;
    researchStage: 'exploration' | 'synthesis' | 'hypothesis' | 'design' | 'review';
    activePersonaId: string;
    constraints: string[]; // e.g., "No animal testing", "Budget < $5000"
}

export interface KnowledgeEntry {
    id: string;
    timestamp: string;
    finding: string;
    source: string; // "Paper: X", "Experiment: Y"
    confidence: 'high' | 'medium' | 'low';
    tags: string[];
}

export interface DecisionEntry {
    id: string;
    timestamp: string;
    decision: string; // "Selected Target X"
    reasoning: string; // "Because high affinity..."
    alternatives_rejected: string[];
    user_approved: boolean;
}

export interface InteractionLog {
    id: string;
    timestamp: string;
    summary: string; // Compressed summary of chat
    action_items: string[];
}

export interface ProjectMemory {
    core: CoreContext;
    knowledge: KnowledgeEntry[];
    decisions: DecisionEntry[];
    interactions: InteractionLog[];
}
