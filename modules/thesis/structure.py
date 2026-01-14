"""
PhD Thesis Structure & Templates
Defines the strict chapter requirements and internal sectioning.
"""
from enum import Enum
from typing import List, Dict, Optional
from pydantic import BaseModel

class ChapterId(str, Enum):
    INTRODUCTION = "chapter_1"
    LITERATURE_REVIEW = "chapter_2"
    GAP_AND_OBJECTIVES = "chapter_3"
    MATERIALS_METHODS = "chapter_4"
    RESULTS = "chapter_5"
    DISCUSSION = "chapter_6"
    CONCLUSION = "chapter_7"
    REFERENCES = "references"

class SectionRequirement(BaseModel):
    title: str
    description: str
    required_proofs: List[str]  # e.g. ["stats", "citations"]
    forbidden_content: List[str] = []

class ChapterTemplate(BaseModel):
    id: ChapterId
    title: str
    sections: List[SectionRequirement]
    proof_type_required: str

THESIS_STRUCTURE: Dict[ChapterId, ChapterTemplate] = {
    ChapterId.INTRODUCTION: ChapterTemplate(
        id=ChapterId.INTRODUCTION,
        title="Introduction",
        sections=[
            SectionRequirement(title="Problem Domain", description="Define disease/problem context.", required_proofs=["citations"]),
            SectionRequirement(title="Global Impact", description="Epidemiology/Statistics.", required_proofs=["citations"]),
            SectionRequirement(title="Unmet Needs", description="Why current solutions fail.", required_proofs=["citations"])
        ],
        proof_type_required="Global Stats / WHO Citations"
    ),
    ChapterId.LITERATURE_REVIEW: ChapterTemplate(
        id=ChapterId.LITERATURE_REVIEW,
        title="Systematic Literature Review",
        sections=[
            SectionRequirement(title="Search Strategy", description="PRISMA flow description.", required_proofs=["methodology"]),
            SectionRequirement(title="Thematic Analysis", description="Grouping by approach (Classical vs AI).", required_proofs=["citations"]),
            SectionRequirement(title="Critical Analysis", description="Identifying contradictions.", required_proofs=["citations"])
        ],
        proof_type_required="Indexed Journal Citations (Scopus/WoS)"
    ),
    ChapterId.GAP_AND_OBJECTIVES: ChapterTemplate(
        id=ChapterId.GAP_AND_OBJECTIVES,
        title="Research Gap & Objectives",
        sections=[
            SectionRequirement(title="Identified Gaps", description="Matrix of limitations in existing work.", required_proofs=["gap_matrix"]),
            SectionRequirement(title="Research Questions", description="Formal questions to be answered.", required_proofs=[]),
            SectionRequirement(title="Objectives", description="SMART objectives aligned to title.", required_proofs=[])
        ],
        proof_type_required="Logical Derivation from Literature"
    ),
    ChapterId.MATERIALS_METHODS: ChapterTemplate(
        id=ChapterId.MATERIALS_METHODS,
        title="Materials & Methods",
        sections=[
            SectionRequirement(title="Data Acquisition", description="Sources, inclusion/exclusion criteria.", required_proofs=["data_source_urls"]),
            SectionRequirement(title="Computational Tools", description="Software, versions, libraries.", required_proofs=["config_files"]),
            SectionRequirement(title="Methodology Pipeline", description="Step-by-step workflow.", required_proofs=["diagrams"])
        ],
        proof_type_required="Reproducible Configs"
    ),
    ChapterId.RESULTS: ChapterTemplate(
        id=ChapterId.RESULTS,
        title="Results",
        sections=[
            SectionRequirement(title="Data Characteristics", description="Descriptive statistics.", required_proofs=["tables"]),
            SectionRequirement(title="Key Findings", description="Primary outcomes.", required_proofs=["tables", "figures"]),
            SectionRequirement(title="Validation Metrics", description="Accuracy, F1, p-values.", required_proofs=["metrics_json"])
        ],
        proof_type_required="Raw Metrics & Logs"
    ),
    ChapterId.DISCUSSION: ChapterTemplate(
        id=ChapterId.DISCUSSION,
        title="Discussion",
        sections=[
            SectionRequirement(title="Interpretation", description="Meaning of results.", required_proofs=[]),
            SectionRequirement(title="Comparative Study", description="Our results vs State of Art.", required_proofs=["comparison_table"]),
            SectionRequirement(title="Limitations", description="Honest assessment of shortcomings.", required_proofs=[])
        ],
        proof_type_required="Literature Comparison"
    ),
    ChapterId.CONCLUSION: ChapterTemplate(
        id=ChapterId.CONCLUSION,
        title="Conclusion & Future Scope",
        sections=[
            SectionRequirement(title="Summary of Contributions", description="What was achieved.", required_proofs=[]),
            SectionRequirement(title="Future Research", description="Next steps.", required_proofs=[]),
            SectionRequirement(title="Clinical Relevance", description="Transcription/Translation potential.", required_proofs=[])
        ],
        proof_type_required="Logical Closure"
    )
}

def get_template(chapter_id: str) -> Optional[ChapterTemplate]:
    try:
        return THESIS_STRUCTURE[ChapterId(chapter_id)]
    except ValueError:
        return None
