"""
PhD Thesis Engine
Orchestrates the writing process, enforcing structure and validation.
Agent Zero handles all AI content generation - this module manages structure and data.
"""
import logging
from typing import Dict, Any, Optional, Callable, List

from modules.thesis.structure import get_template, THESIS_STRUCTURE, ChapterId, ChapterTemplate, SectionRequirement
from modules.thesis.validator import thesis_validator
from modules.agent.prompts import PHD_THESIS_WRITER_PROMPT
from modules.rag.vector_store import get_vector_store

logger = logging.getLogger("thesis.engine")


class ThesisEngine:
    """
    PhD Thesis chapter generation engine.
    
    This module manages thesis structure, validation, and data preparation.
    Agent Zero handles all content generation through callbacks.
    """
    
    def __init__(self):
        self.vector_store = get_vector_store()
        self._agent_callback: Optional[Callable] = None
        self._current_thesis_context: Dict[str, Any] = {}
    
    def set_agent_callback(self, callback: Callable[[str], str]):
        """
        Set the Agent Zero callback for content generation.
        
        Args:
            callback: Function that takes a prompt and returns generated content
        """
        self._agent_callback = callback
    
    def set_thesis_context(self, context: Dict[str, Any]):
        """
        Set the thesis-wide context (research title, disease context, etc.)
        This is used across all chapter generations.
        """
        self._current_thesis_context = context

    async def generate_chapter(
        self, 
        chapter_id: str, 
        topic: str,
        agent_generate: Optional[Callable[[str, str, Dict], str]] = None
    ) -> Dict[str, Any]:
        """
        Generate a thesis chapter.
        
        Args:
            chapter_id: Chapter identifier (e.g., "chapter_1")
            topic: Research topic
            agent_generate: Agent Zero callback for section generation
                           Signature: (section_title, section_desc, context) -> content
        
        Returns:
            Dict with chapter content or error status
        """
        logger.info(f"Generating {chapter_id} for topic: {topic}")
        
        # 1. Structure Check
        template = get_template(chapter_id)
        if not template:
            return {"status": "error", "message": f"Invalid chapter ID: {chapter_id}"}
        
        # 2. Proof Validation
        validation = thesis_validator.validate_chapter_readiness(chapter_id)
        if validation["status"] != "valid":
            return {
                "status": "blocked",
                "reason": "Missing Proofs",
                "details": validation
            }
        
        # 3. Get relevant context from vector store
        chapter_context = self._get_chapter_context(template, topic)
        
        # 4. Generate chapter content
        if agent_generate:
            draft = await self._generate_with_agent(template, topic, chapter_context, agent_generate)
        elif self._agent_callback:
            draft = await self._generate_with_callback(template, topic, chapter_context)
        else:
            # Fallback to structured template
            draft = self._generate_template(template, topic, chapter_context)
        
        return {
            "status": "success",
            "chapter_id": chapter_id,
            "title": template.title,
            "content": draft,
            "validation_log": validation,
            "context_used": len(chapter_context.get("excerpts", []))
        }
    
    def _get_chapter_context(self, template: ChapterTemplate, topic: str) -> Dict[str, Any]:
        """Retrieve relevant context from vector store for chapter generation."""
        context = {
            "topic": topic,
            "thesis_context": self._current_thesis_context,
            "excerpts": [],
            "section_contexts": {}
        }
        
        try:
            # Get overall chapter context
            query = f"{topic} {template.title}"
            results = self.vector_store.search(query, k=5)
            context["excerpts"] = [r.get("text", "")[:500] for r in results]
            
            # Get section-specific context
            for section in template.sections:
                section_query = f"{topic} {section.title} {section.description}"
                section_results = self.vector_store.search(section_query, k=3)
                context["section_contexts"][section.title] = [
                    r.get("text", "")[:400] for r in section_results
                ]
        except Exception as e:
            logger.warning(f"Failed to retrieve context: {e}")
        
        return context
    
    async def _generate_with_agent(
        self,
        template: ChapterTemplate,
        topic: str,
        context: Dict[str, Any],
        agent_generate: Callable
    ) -> str:
        """Generate chapter using Agent Zero's callback."""
        content = [f"# Chapter: {template.title}\n"]
        content.append(f"> **Research Topic**: {topic}\n")
        
        for section in template.sections:
            section_context = context.get("section_contexts", {}).get(section.title, [])
            
            # Agent Zero generates the section content
            section_content = agent_generate(
                section.title,
                section.description,
                {
                    "topic": topic,
                    "required_proofs": section.required_proofs,
                    "context": section_context,
                    "chapter": template.title
                }
            )
            
            content.append(f"## {section.title}")
            content.append(section_content)
            content.append("")
        
        return "\n".join(content)
    
    async def _generate_with_callback(
        self,
        template: ChapterTemplate,
        topic: str,
        context: Dict[str, Any]
    ) -> str:
        """Generate chapter using registered Agent Zero callback."""
        content = [f"# Chapter: {template.title}\n"]
        content.append(f"> **Research Topic**: {topic}\n")
        
        for section in template.sections:
            section_context = context.get("section_contexts", {}).get(section.title, [])
            context_text = "\n".join(section_context) if section_context else "No specific context."
            
            # Build prompt for Agent Zero
            prompt = f"""Write the "{section.title}" section for a PhD thesis chapter on "{template.title}".

RESEARCH TOPIC: {topic}
SECTION FOCUS: {section.description}
REQUIRED PROOFS: {', '.join(section.required_proofs) if section.required_proofs else 'None'}

RESEARCH CONTEXT:
{context_text}

INSTRUCTIONS:
- Write 300-500 words of academic content
- Use formal scientific language
- Include citations where appropriate ([Author et al., Year])
- Focus on: {section.description}

Write the section:"""

            section_content = self._agent_callback(prompt)
            
            content.append(f"## {section.title}")
            content.append(section_content if section_content else f"*{section.description}*")
            content.append("")
        
        return "\n".join(content)
    
    def _generate_template(
        self,
        template: ChapterTemplate,
        topic: str,
        context: Dict[str, Any]
    ) -> str:
        """Generate structured template when no agent is available."""
        content = [f"# Chapter: {template.title}\n"]
        content.append(f"> **Research Topic**: {topic}\n")
        
        for section in template.sections:
            section_context = context.get("section_contexts", {}).get(section.title, [])
            
            content.append(f"## {section.title}")
            content.append(f"*{section.description}*\n")
            
            if section_context:
                content.append("**Relevant Research Context:**")
                for excerpt in section_context[:2]:
                    content.append(f"> {excerpt}...")
                content.append("")
            
            if section.required_proofs:
                content.append(f"*Required proofs: {', '.join(section.required_proofs)}*")
            
            content.append("\n[Content to be generated by Agent Zero...]\n")
        
        return "\n".join(content)
    
    def prepare_for_agent(self, chapter_id: str, topic: str) -> Dict[str, Any]:
        """
        Prepare chapter data for Agent Zero to process.
        
        Returns structured data for Agent Zero's planning and execution.
        """
        template = get_template(chapter_id)
        if not template:
            return {"error": f"Invalid chapter ID: {chapter_id}"}
        
        # Validation check
        validation = thesis_validator.validate_chapter_readiness(chapter_id)
        
        # Get context
        context = self._get_chapter_context(template, topic)
        
        return {
            "task": "thesis_chapter_generation",
            "chapter_id": chapter_id,
            "chapter_title": template.title,
            "topic": topic,
            "thesis_context": self._current_thesis_context,
            "validation_status": validation["status"],
            "validation_details": validation,
            "sections": [
                {
                    "title": s.title,
                    "description": s.description,
                    "required_proofs": s.required_proofs,
                    "context": context.get("section_contexts", {}).get(s.title, [])
                }
                for s in template.sections
            ],
            "proof_type_required": template.proof_type_required,
            "system_prompt": PHD_THESIS_WRITER_PROMPT[:2000]  # First 2000 chars for context
        }
    
    def assemble_chapter(
        self,
        chapter_id: str,
        topic: str,
        section_contents: Dict[str, str]
    ) -> str:
        """
        Assemble a complete chapter from Agent Zero generated sections.
        
        Args:
            chapter_id: Chapter identifier
            topic: Research topic
            section_contents: Dict mapping section titles to generated content
        
        Returns:
            Complete formatted chapter
        """
        template = get_template(chapter_id)
        if not template:
            return f"# Error: Invalid chapter ID {chapter_id}"
        
        content = [f"# Chapter: {template.title}\n"]
        content.append(f"> **Research Topic**: {topic}\n")
        content.append("---\n")
        
        for section in template.sections:
            section_content = section_contents.get(
                section.title,
                f"*{section.description} - Content pending.*"
            )
            content.append(f"## {section.title}")
            content.append(section_content)
            content.append("")
        
        return "\n".join(content)
    
    def get_all_chapters(self) -> List[Dict[str, Any]]:
        """Get information about all thesis chapters."""
        chapters = []
        for chapter_id in ChapterId:
            if chapter_id == ChapterId.REFERENCES:
                continue
            template = THESIS_STRUCTURE.get(chapter_id)
            if template:
                chapters.append({
                    "id": chapter_id.value,
                    "title": template.title,
                    "section_count": len(template.sections),
                    "proof_required": template.proof_type_required
                })
        return chapters


# Singleton
thesis_engine = ThesisEngine()


def get_thesis_engine() -> ThesisEngine:
    """Get the thesis engine singleton."""
    return thesis_engine
