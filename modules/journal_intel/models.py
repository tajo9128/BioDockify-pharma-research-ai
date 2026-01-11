from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class JournalIdentity(BaseModel):
    """Canonical Identity of a Journal."""
    title: str
    issn: str
    eissn: Optional[str] = None
    publisher: str
    country: str
    url: Optional[str] = None

class PillarScore(BaseModel):
    """Result of a single validation pillar."""
    name: str
    status: str  # PASS, FAIL, CAUTION, SKIP
    score: float # 0.0 to 1.0 (Wait... user said no ML scores, but we need weights maybe? Or just binary pass/fail logic translated to internal weight)
    details: str
    timestamp: datetime = Field(default_factory=datetime.now)

class VerificationResult(BaseModel):
    """Final Verification Certificate."""
    input_issn: str
    input_title: str
    input_url: Optional[str]
    
    canonical_identity: Optional[JournalIdentity] = None
    
    decision: str # VERIFIED, SUSPICIOUS, HIGH_RISK
    confidence_level: str # HIGH, MEDIUM, LOW
    
    pillars: List[PillarScore]
    
    risk_factors: List[str] = []
    audit_trail: List[str] = []
    timestamp: datetime = Field(default_factory=datetime.now)
    engine_version: str = "BioDockify Journal Intel v1.0"
