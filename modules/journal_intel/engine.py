from datetime import datetime
from typing import Optional, List
from .models import VerificationResult, PillarScore
from .resolvers import CanonicalResolver
from .verifiers import IndexVerifier, FraudGuard, WebsiteAuthenticator

class DecisionEngine:
    """
    Core Decision Logic for Journal Authenticity.
    Aggregates validation pillars and applies conservative risk logic.
    """
    
    def __init__(self):
        self.resolver = CanonicalResolver()
        self.index_verifier = IndexVerifier()
        self.fraud_guard = FraudGuard()
        self.web_auth = WebsiteAuthenticator()

    def verify(self, issn: str, title: str, url: Optional[str] = None) -> VerificationResult:
        pillars: List[PillarScore] = []
        risk_factors: List[str] = []
        audit_trail: List[str] = []
        
        audit_trail.append(f"Started verification for ISSN: {issn}, Title: {title}")

        # --- Pillar 1: Canonical Identity (Mandatory) ---
        identity = self.resolver.resolve(issn, title)
        
        if not identity:
            # STOP immediately if we can't identify the journal
            audit_trail.append("Pillar 1 Failed: Could not resolve canonical identity from ISSN/Title.")
            return VerificationResult(
                input_issn=issn, input_title=title, input_url=url,
                decision="SUSPICIOUS",
                confidence_level="MEDIUM",
                pillars=[PillarScore(name="Canonical Identity", status="FAIL", score=0.0, details="Journal not found in trusted local authority database.")],
                risk_factors=["Identity Unverifiable"],
                audit_trail=audit_trail
            )
        
        audit_trail.append(f"Identity Resolved: {identity.title} ({identity.publisher})")
        pillars.append(PillarScore(name="Canonical Identity", status="PASS", score=1.0, details=f"Matched canonical record: {identity.title}"))

        # --- Pillar 2: Authoritative Indexing (Mandatory) ---
        index_score = self.index_verifier.verify(identity)
        pillars.append(index_score)
        if index_score.status != "PASS":
            risk_factors.append("Not indexed in trusted list (WoS)")
            audit_trail.append(f"Pillar 2 Failed: {index_score.details}")

        # --- Pillar 5: Fraud Intelligence (Critical Check) ---
        fraud_score = self.fraud_guard.check(identity.issn, url)
        pillars.append(fraud_score)
        if fraud_score.status == "FAIL":
            # Immediate High Risk
            risk_factors.append("CRITICAL: Matched known hijacked domain/ISSN")
            audit_trail.append("Pillar 5 Critical Failure: Journal is hijacked.")
        elif fraud_score.status == "CAUTION":
             risk_factors.append("ISSN linked to known hijack (URL verification needed)")

        # --- Pillar 3 & 4: Website Authenticity (Mandatory if URL provided) ---
        if url:
            web_score = self.web_auth.verify_consistency(identity, url)
            pillars.append(web_score)
            if web_score.status != "PASS":
                risk_factors.append("Website domain inconsistent with publisher")
                audit_trail.append(f"Pillar 3/4 Issue: {web_score.details}")
        else:
             pillars.append(PillarScore(name="Website Auth", status="SKIP", score=0.0, details="No URL provided"))

        # --- FINAL DECISION LOGIC ---
        # "Conservative" Logic:
        # 1. Any Fraud FAIL -> HIGH RISK
        # 2. Identity OR Indexing FAIL -> SUSPICIOUS (at best) or HIGH RISK (if claiming indexing)
        # 3. Web Fail -> SUSPICIOUS
        
        decision = "VERIFIED"
        confidence = "HIGH"
        
        # Check Critical Failures first
        if fraud_score.status == "FAIL":
            decision = "HIGH_RISK"
            confidence = "HIGH"
        
        # Check Mandatory Pillars
        elif index_score.status != "PASS":
             # Use case: User thinks it's indexed, but our DB says no.
             decision = "HIGH_RISK" # We treat false indexing claims as high risk
             risk_factors.append("Indexing claim validation failed")
        
        # Check Consistency
        elif url and web_score.status != "PASS":
             decision = "SUSPICIOUS" # Could be a valid but weird domain, or a clever clone
             confidence = "MEDIUM"
             
        elif fraud_score.status == "CAUTION":
             decision = "SUSPICIOUS"
             confidence = "MEDIUM"

        return VerificationResult(
            input_issn=issn,
            input_title=title,
            input_url=url,
            canonical_identity=identity,
            decision=decision,
            confidence_level=confidence,
            pillars=pillars,
            risk_factors=risk_factors,
            audit_trail=audit_trail
        )
