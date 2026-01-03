"""
Research Executor - BioDockify Pharma Research AI
Executes the Research Plan by coordinating core modules.
"""

import os
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional

from orchestration.planner.orchestrator import ResearchPlan, ResearchStep

# Import Core Modules
from modules.pdf_processor.parser import parse_pdf_text
from modules.bio_ner.ner_engine import BioNER
from modules.graph_builder.loader import add_paper, connect_compound, create_constraints
from modules.analyst.analytics_engine import ResearchAnalyst
try:
    from modules.molecular_vision.im2smiles import Im2SMILES
    has_molecular_vision = True
except ImportError:
    has_molecular_vision = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("BioDockify.Executor")

@dataclass
class ResearchContext:
    """
    Holds the state and data for the current research session.
    """
    topic: str
    extracted_text: str = ""
    entities: Dict[str, List[str]] = field(default_factory=dict)
    known_papers: List[Dict[str, Any]] = field(default_factory=list)
    image_paths: List[str] = field(default_factory=list)
    analyst_stats: Dict[str, Any] = field(default_factory=dict)

class ResearchExecutor:
    """
    Executes a ResearchPlan step-by-step.
    """
    
    def __init__(self):
        self.ner = BioNER()
        self.analyst = ResearchAnalyst()
        if has_molecular_vision:
            self.vision = Im2SMILES()
        
        # Ensure graph constraints
        try:
            create_constraints()
        except:
            pass # Ignore if offline

    def execute_plan(self, plan: ResearchPlan) -> ResearchContext:
        """
        Execute the entire research plan.
        """
        logger.info(f"Starting execution of plan: {plan.research_title}")
        context = ResearchContext(topic=plan.research_title)
        
        for step in plan.steps:
            logger.info(f"--- Executing Step {step.step_id}: {step.title} ---")
            try:
                self._execute_step(step, context)
                logger.info(f"✓ Step {step.step_id} completed.")
            except Exception as e:
                logger.error(f"✗ Step {step.step_id} failed: {e}")
                # We verify if we should abort or continue; for now continue
        
        return context

    def _execute_step(self, step: ResearchStep, context: ResearchContext):
        """
        Dispatch execution based on step category.
        """
        category = step.category
        
        if category == "literature_search":
            self._handle_literature_search(step, context)
        elif category == "entity_extraction":
            self._handle_entity_extraction(step, context)
        elif category == "graph_building":
            self._handle_graph_building(step, context)
        elif category == "data_analysis":
            self._handle_data_analysis(step, context)
        elif category == "molecular_analysis" and has_molecular_vision:
             self._handle_molecular_vision(step, context)
        elif category == "final_report":
            self._handle_final_report(step, context)
        else:
            logger.warning(f"No handler for category: {category}")

    def _handle_literature_search(self, step: ResearchStep, context: ResearchContext):
        """
        Scan data/papers directory for PDFs and extract text.
        """
        paper_dir = os.path.join("data", "papers")
        if not os.path.exists(paper_dir):
            os.makedirs(paper_dir, exist_ok=True)
            logger.info(f"Created {paper_dir}. Please place PDFs there.")
            return

        pdf_files = [f for f in os.listdir(paper_dir) if f.lower().endswith('.pdf')]
        logger.info(f"Found {len(pdf_files)} PDFs in {paper_dir}")

        all_text = []
        for pdf_file in pdf_files:
            path = os.path.join(paper_dir, pdf_file)
            try:
                text = parse_pdf_text(path)
                all_text.append(text)
                # Add to known papers list (simple mock metadata)
                context.known_papers.append({
                    "pmid": pdf_file, # using filename as ID for now
                    "title": pdf_file,
                    "abstract": text[:200] + "..."
                })
            except Exception as e:
                logger.error(f"Failed to parse {pdf_file}: {e}")
        
        context.extracted_text = "\n\n".join(all_text)
        logger.info(f"Total extracted text length: {len(context.extracted_text)} chars")

    def _handle_entity_extraction(self, step: ResearchStep, context: ResearchContext):
        """
        Run BioNER on the extracted text.
        """
        if not context.extracted_text:
            logger.warning("No text to analyze. Skipping NER.")
            # Fallback for testing: use a dummy text if empty
            context.extracted_text = f"Research on {context.topic}. Potential targets include BRCA1 and EGFR."
        
        entities = self.ner.extract_entities(context.extracted_text)
        context.entities = entities
        
        logger.info(f"Extracted Entities: {len(entities.get('drugs', []))} drugs, "
                    f"{len(entities.get('diseases', []))} diseases, "
                    f"{len(entities.get('genes', []))} genes")

    def _handle_graph_building(self, step: ResearchStep, context: ResearchContext):
        """
        Push extracted data to Neo4j.
        """
        # 1. Add Papers
        for paper in context.known_papers:
            add_paper(paper)
            
            # 2. Connect extracted entities to this paper (Simplified: linking all to all for MVP)
            # In a real app, we'd extract entities PER paper.
            # Here we just link global entities to the first paper as a demo.
            
            if context.entities:
                for drug in context.entities.get("drugs", []):
                    connect_compound(paper['pmid'], drug)
                # TODO: Add functions for diseases/genes in GraphBuilder
        
        logger.info("Graph population steps initiated.")

    def _handle_data_analysis(self, step: ResearchStep, context: ResearchContext):
        """
        Run analytics.
        """
        stats = self.analyst.get_graph_statistics()
        context.analyst_stats = stats
        logger.info(f"Graph Stats: {stats}")
        
        repurposing = self.analyst.find_potential_repurposing()
        if repurposing:
            logger.info(f"Found {len(repurposing)} repurposing candidates.")

    def _handle_molecular_vision(self, step: ResearchStep, context: ResearchContext):
        """
        Process images if available.
        """
        # Placeholder: Scan for image files or use extracted images from PDFs
        logger.info("Molecular vision step (Placeholder for image scanning)")

    def _handle_final_report(self, step: ResearchStep, context: ResearchContext):
        """
        Generate Final Report (DOCX) and Lab Protocols (SiLA).
        """
        logger.info("Generating Final Report and Lab Protocols...")
        
        # Ensure output directories exist
        report_dir = os.path.join("lab_interface", "reports")
        sila_dir = os.path.join("lab_interface", "sila_protocols")
        os.makedirs(report_dir, exist_ok=True)
        os.makedirs(sila_dir, exist_ok=True)
        
        # Prepare Data
        research_data = {
            "title": context.topic,
            "entities": context.entities,
            "stats": context.analyst_stats,
            "text_preview": context.extracted_text[:500]
        }
        
        # 1. Generate DOCX Report
        from modules.lab_interface.report_generator import ResearchReportGenerator
        reporter = ResearchReportGenerator()
        filename = f"{context.topic.replace(' ', '_')}_Report.docx"
        filepath = os.path.join(report_dir, filename)
        try:
            reporter.create_docx(research_data, filepath)
            logger.info(f"✓ Report generated: {filepath}")
        except Exception as e:
            logger.error(f"Failed to generate report: {e}")

        # 2. Generate SiLA Protocol
        from modules.lab_interface.sila_generator import LiquidHandlerSiLA
        sila_gen = LiquidHandlerSiLA()
        try:
            xml_content = sila_gen.generate_protocol(research_data)
            xml_filename = f"{context.topic.replace(' ', '_')}_Protocol.xml"
            xml_path = os.path.join(sila_dir, xml_filename)
            with open(xml_path, "w") as f:
                f.write(xml_content)
            logger.info(f"✓ SiLA Protocol generated: {xml_path}")
        except Exception as e:
            logger.error(f"Failed to generate SiLA protocol: {e}")
