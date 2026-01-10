import { DEFAULT_CONSTITUTION } from './default_constitution';
import { AgentConstitution } from './constitution';
import { AgentPersona } from '@/lib/personas';
import { THINKING_CONSTITUTION_TEXT } from './full_constitution_text';

interface PromptContext {
    userRole?: string;
    currentTask?: string;
    activeView?: string;
    openFiles?: string[];
}

export class SystemPromptBuilder {
    private constitution: AgentConstitution;

    constructor(customConstitution?: AgentConstitution) {
        this.constitution = customConstitution || DEFAULT_CONSTITUTION;
    }

    public build(persona: AgentPersona, context: PromptContext): string {
        const parts: string[] = [];

        // 1. THE THINKING CONSTITUTION (Supreme Law)
        parts.push(THINKING_CONSTITUTION_TEXT);

        // 1.1 IDENTITY & ROLE (Operational)
        parts.push("\n### OPERATIONAL IDENTITY");
        parts.push(this.constitution.identity.role_definition);
        parts.push(`TONE: ${this.constitution.identity.tone}`);

        // 2. PRIME DIRECTIVES (Specific Laws)
        parts.push("\n### PRIME DIRECTIVES (LAWS)");
        this.constitution.laws.forEach(law => {
            parts.push(`${law.id}: ${law.name} - ${law.rule}`);
        });

        // 3. PERSONA-SPECIFIC INSTRUCTIONS
        parts.push(`\n### ACTIVE PERSONA: ${persona.label}`);
        parts.push(persona.systemPrompt);
        parts.push(`STRICTNESS LEVEL: ${persona.strictness}`);

        if (persona.specificRules && persona.specificRules.length > 0) {
            parts.push("SPECIFIC RULES FOR THIS PERSONA:");
            persona.specificRules.forEach(rule => parts.push(`- ${rule}`));
        }

        // 4. CONTEXTUAL MODULES & RULES
        parts.push("\n### OPERATIONAL CONTEXT");
        if (context.currentTask) {
            parts.push(`Current User Task: ${context.currentTask}`);
        }

        // Match modules to view/context
        const activeModules = this.constitution.core_modules.filter(m =>
            m.trigger_context.some(trigger =>
                (context.activeView && context.activeView.includes(trigger)) ||
                (context.currentTask && context.currentTask.toLowerCase().includes(trigger))
            )
        );

        if (activeModules.length > 0) {
            parts.push("Active Modules:");
            activeModules.forEach(m => {
                parts.push(`- [${m.name}]: ${m.instructions}`);
            });
        }

        // 5. INTERNAL CHECKLIST (The "Pre-Flight" Check)
        parts.push("\n### INTERNAL CHECKLIST");
        parts.push("Before answering, you must silently verify:");
        parts.push("1. Is this evidence-backed? (Cite sources)");
        parts.push(`2. Is this appropriate for a ${persona.label}?`);
        parts.push("3. Does this require human judgment? (If so, flag it)");
        parts.push("4. Is there ethical/regulatory risk?");

        // 6. FORBIDDEN ACTIONS
        parts.push("\n### REFUSAL LIST (FORBIDDEN)");
        this.constitution.forbidden_actions.forEach(action => {
            parts.push(`- ${action}`);
        });

        return parts.join("\n");
    }
}

export const promptBuilder = new SystemPromptBuilder();
