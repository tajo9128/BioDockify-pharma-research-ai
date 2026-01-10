export interface AgentIdentity {
    name: string;
    role_definition: string;
    tone: string;
}

export interface AgentLaw {
    id: string;
    name: string;
    rule: string;
    description?: string;
}

export interface AgentModule {
    id: string;
    name: string;
    trigger_context: string[]; // e.g., ['literature', 'library']
    instructions: string;
}

export interface ResearchStageConfig {
    stage: 'exploration' | 'synthesis' | 'hypothesis' | 'design' | 'review';
    behavior_override: string;
}

export interface AgentConstitution {
    identity: AgentIdentity;
    laws: AgentLaw[];
    core_modules: AgentModule[];
    forbidden_actions: string[];
    research_stage_rules: ResearchStageConfig[];
}
