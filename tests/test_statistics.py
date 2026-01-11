import unittest
from modules.statistics.engine import StatisticalEngine

class TestStatisticalEngine(unittest.TestCase):
    def setUp(self):
        self.engine = StatisticalEngine()
        # Simple balanced dataset
        self.data_two_group = [
            {"group": "A", "val": 10}, {"group": "A", "val": 12}, {"group": "A", "val": 11},
            {"group": "B", "val": 20}, {"group": "B", "val": 22}, {"group": "B", "val": 21}
        ]

    def test_basic_tier_output(self):
        """Test Tier 1 (Guided) output structure"""
        result = self.engine.analyze(self.data_two_group, "two_group", tier="basic")
        
        self.assertEqual(result["tier"], "basic")
        self.assertIn("summary", result)
        self.assertIn("recommendation", result)
        # Should NOT have advanced fields
        self.assertNotIn("methodology_text", result)
        
        # Check correctness of stats (A vs B is very different)
        raw = result["raw"]
        self.assertLess(raw["p_value"], 0.05)
        self.assertEqual(raw["test_used"], "Student's t-test") # Equal variance expected for this perf data

    def test_analytical_tier_output(self):
        """Test Tier 2 (Analytical) output structure"""
        result = self.engine.analyze(self.data_two_group, "two_group", tier="analytical")
        
        self.assertEqual(result["tier"], "analytical")
        self.assertIn("assumptions_check", result)
        self.assertIn("summary", result)
        
        # Check assumption text
        assumptions = result["assumptions_check"]
        self.assertTrue(any("Normality" in a for a in assumptions))

    def test_advanced_tier_output(self):
        """Test Tier 3 (Advanced) output structure"""
        result = self.engine.analyze(self.data_two_group, "two_group", tier="advanced")
        
        self.assertEqual(result["tier"], "advanced")
        self.assertIn("methodology_text", result)
        self.assertIn("reproducibility", result)
        self.assertIn("full_data", result)
        
        # Check methodology text content
        text = result["methodology_text"]
        self.assertIn("Student's t-test", text)
        self.assertIn("p-value", text)

    def test_anova_logic(self):
        """Test ANOVA selection"""
        data_anova = self.data_two_group + [
            {"group": "C", "val": 30}, {"group": "C", "val": 32}, {"group": "C", "val": 31}
        ]
        result = self.engine.analyze(data_anova, "anova", tier="basic")
        
        self.assertEqual(result["raw"]["type"], "anova")
        self.assertIn("ANOVA", result["raw"]["test_used"])

if __name__ == '__main__':
    unittest.main()
