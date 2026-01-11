import unittest
from modules.journal_intel import DecisionEngine

class TestJournalIntel(unittest.TestCase):
    def setUp(self):
        self.engine = DecisionEngine()

    def test_nature_verified(self):
        """Test a known good journal from our local mock DB."""
        # Verified Case: Nature is in our wos_master_list.json
        res = self.engine.verify(
            issn="0028-0836",
            title="Nature",
            url="https://www.nature.com"
        )
        self.assertEqual(res.decision, "VERIFIED")
        self.assertEqual(res.confidence_level, "HIGH")
        
        # Check Pillars
        identity = next(p for p in res.pillars if p.name == "Canonical Identity")
        self.assertEqual(identity.status, "PASS")
        
        index = next(p for p in res.pillars if p.name == "Authoritative Indexing")
        self.assertEqual(index.status, "PASS")

    def test_unknown_journal(self):
        """Test a journal NOT in our DB."""
        res = self.engine.verify(
            issn="9999-9999",
            title="My Fake Journal",
            url="http://fake.com"
        )
        # Should fail identity check -> Suspicious/High Risk
        # Per logic: If identity fails -> Suspicious (medium conf)
        self.assertEqual(res.decision, "SUSPICIOUS")
        self.assertIn("Identity Unverifiable", res.risk_factors)

    def test_hijacked_journal(self):
        """Test a known hijacked journal."""
        # "Wulfenia" is in our hijacked_journals.json with issn 1561-882X
        # And fake url: www.wulfeniajournal.com
        res = self.engine.verify(
            issn="1561-882X",
            title="Wulfenia",
            url="http://www.wulfeniajournal.com"
        )
        self.assertEqual(res.decision, "HIGH_RISK")
        self.assertIn("CRITICAL: Matched known hijacked domain/ISSN", res.risk_factors)

    def test_url_mismatch(self):
        """Test valid journal but inconsistent URL."""
        # Nature (Valid) but URL is "google.com" (Inconsistent with publisher Nature Portfolio)
        res = self.engine.verify(
            issn="0028-0836",
            title="Nature",
            url="https://google.com"
        )
        # Identity Pass, Index Pass, Fraud Pass.
        # Website Consistency -> Fail/Caution
        # Logic: If Web mismatch -> Suspicious
        self.assertEqual(res.decision, "SUSPICIOUS")
        
        web_pillar = next(p for p in res.pillars if "Website" in p.name)
        self.assertNotEqual(web_pillar.status, "PASS")

if __name__ == '__main__':
    unittest.main()
