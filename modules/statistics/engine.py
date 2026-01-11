import pandas as pd
import numpy as np
from scipy import stats
from typing import Dict, List, Optional, Any, Union
import json
import logging

# Configure logger
logger = logging.getLogger(__name__)

class StatisticalEngine:
    """
    Unified Statistical Engine implementing the 3-Tier Framework.
    
    Tiers:
    - Tier 1: Guided / Basic (Summary, Plain English, Simple Tests)
    - Tier 2: Analytical / Intermediate (Assumptions, Alternatives, Diagnostics)
    - Tier 3: Research-Grade (Full Control, Methodology Text, Code)
    """

    def analyze(self, 
                data: List[Dict[str, Any]], 
                design: str, 
                tier: str = "basic") -> Dict[str, Any]:
        """
        Main entry point for analysis.
        
        Args:
            data: List of records (rows).
            design: Type of analysis ('one_group', 'two_group', 'correlation', 'anova').
            tier: 'basic', 'analytical', or 'advanced'.
            
        Returns:
            Dictionary containing analysis results formatted for the requested tier.
        """
        try:
            df = pd.DataFrame(data)
            
            # 1. Clean Data (Shared Logic)
            df = self._clean_data(df)
            
            # 2. Variable Selection (Heuristic for demo, normally explicitly passed)
            # Assuming 'group' column for grouping, 'value' for measurement if present,
            # or just numeric columns for correlation.
            
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            categorical_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
            
            results = {}

            # 3. Route by Design
            if design == "two_group":
                results = self._analyze_two_group(df, numeric_cols[0], categorical_cols[0] if categorical_cols else None)
            elif design == "correlation":
                results = self._analyze_correlation(df, numeric_cols)
            elif design == "anova":
                # For >2 groups
                results = self._analyze_anova(df, numeric_cols[0], categorical_cols[0] if categorical_cols else None)
            else:
                # Default descriptive
                results = self._analyze_descriptive(df, numeric_cols)

            # 4. Format Output based on Tier
            return self._format_output(results, tier)

        except Exception as e:
            logger.error(f"Statistical Analysis Failed: {e}")
            return {
                "error": str(e), 
                "message": "Analysis failed. Please check your data format.",
                "tier": tier
            }

    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Standard cleaning: Drop NaNs in relevant numeric types."""
        return df.dropna()

    def _analyze_descriptive(self, df: pd.DataFrame, cols: List[str]) -> Dict:
        """Basic descriptive stats."""
        stats_dict = {}
        for col in cols:
            desc = df[col].describe().to_dict()
            stats_dict[col] = desc
        return {"type": "descriptive", "stats": stats_dict}

    def _analyze_two_group(self, df: pd.DataFrame, value_col: str, group_col: str) -> Dict:
        """T-Test logic (Independent)"""
        if not group_col:
            return {"error": "Categorical group column required for two-group analysis."}
        
        groups = df[group_col].unique()
        if len(groups) != 2:
            return {"error": f"Requires exactly 2 groups, found {len(groups)}: {groups}"}
            
        g1 = df[df[group_col] == groups[0]][value_col]
        g2 = df[df[group_col] == groups[1]][value_col]
        
        # Assumption Checks
        shapiro_1 = stats.shapiro(g1)
        shapiro_2 = stats.shapiro(g2)
        levene = stats.levene(g1, g2)
        
        # Test Selection Logic
        test_name = "Student's t-test"
        if levene.pvalue < 0.05:
            # Unequal variance -> Welch
            name = "Welch's t-test"
            res = stats.ttest_ind(g1, g2, equal_var=False)
        else:
            # Check normality
            if shapiro_1.pvalue < 0.05 or shapiro_2.pvalue < 0.05:
                # Non-parametric
                name = "Mann-Whitney U test"
                res = stats.mannwhitneyu(g1, g2)
            else:
                # Standard
                name = "Student's t-test"
                res = stats.ttest_ind(g1, g2, equal_var=True)

        return {
            "type": "two_group",
            "groups": {str(groups[0]): g1.mean(), str(groups[1]): g2.mean()},
            "test_used": name,
            "statistic": res.statistic,
            "p_value": res.pvalue,
            "assumptions": {
                "normality": {"g1": shapiro_1.pvalue, "g2": shapiro_2.pvalue},
                "homogeneity": levene.pvalue
            },
            "effect_size": (g1.mean() - g2.mean()) # Simple raw diff for now
        }

    def _analyze_correlation(self, df: pd.DataFrame, cols: List[str]) -> Dict:
        """Correlation Matrix"""
        if len(cols) < 2:
            return {"error": "Need at least 2 numeric columns for correlation."}
            
        corr_matrix = df[cols].corr(method='pearson').to_dict()
        return {"type": "correlation", "matrix": corr_matrix}

    def _analyze_anova(self, df: pd.DataFrame, value_col: str, group_col: str) -> Dict:
        """One-way ANOVA logic"""
        if not group_col:
            return {"error": "Group column needed."}
            
        groups = [df[df[group_col]==g][value_col] for g in df[group_col].unique()]
        
        # Assumption: Levene
        levene = stats.levene(*groups)
        
        if levene.pvalue < 0.05:
            # Kruskal-Wallis (Non-parametric for ANOVA equivalent-ish)
            name = "Kruskal-Wallis H-test"
            res = stats.kruskal(*groups)
        else:
            name = "One-way ANOVA"
            res = stats.f_oneway(*groups)
            
        return {
            "type": "anova",
            "test_used": name,
            "statistic": res.statistic,
            "p_value": res.pvalue,
            "assumptions": {"homogeneity": levene.pvalue}
        }

    def _format_output(self, raw: Dict, tier: str) -> Dict:
        """
        Formats the raw statistical results based on the User Tier.
        """
        output = {"tier": tier, "raw": raw}
        
        # Language & Depth Control
        if tier == "basic":
            # Tier 1: Plain English, minimal stats
            output["summary"] = self._generate_plain_english(raw)
            output["recommendation"] = "Result is significant." if raw.get("p_value", 1) < 0.05 else "No significant difference found."
            
        elif tier == "analytical":
             # Tier 2: Educational, show assumptions
            output["summary"] = self._generate_educational_text(raw)
            output["assumptions_check"] = self._explain_assumptions(raw)
            output["details"] = raw # Show raw numbers
            
        elif tier == "advanced":
             # Tier 3: Reviewer grade, methodology
            output["methodology_text"] = self._generate_methodology(raw)
            output["reproducibility"] = {
                "engine_version": "BioDockify Stats v1.0",
                "test_timestamp": pd.Timestamp.now().isoformat()
            }
            output["code_snippet"] = "# Python/Scipy code matching this analysis..."
            output["full_data"] = raw

        return output

    def _generate_plain_english(self, res: Dict) -> str:
        """Tier 1 Text Generator"""
        if "p_value" not in res:
            return "Analysis complete. See charts."
            
        p = res["p_value"]
        test = res.get("test_used", "Test")
        
        if p < 0.05:
            return f"The statistical test ({test}) suggests there is a meaningful difference or relationship (p = {p:.4f})."
        else:
            return f"The statistical test ({test}) did not find enough evidence to prove a difference (p = {p:.4f})."

    def _generate_educational_text(self, res: Dict) -> str:
        """Tier 2 Text Generator"""
        text = self._generate_plain_english(res)
        if "assumptions" in res:
            text += " We checked the data distribution to ensure the test was valid."
        return text

    def _explain_assumptions(self, res: Dict) -> List[str]:
        """Tier 2 Assumption Explainer"""
        explanations = []
        assumptions = res.get("assumptions", {})
        
        if "homogeneity" in assumptions:
            val = assumptions["homogeneity"]
            status = "Violated" if val < 0.05 else "Met"
            explanations.append(f"Equal Variance (Homogeneity): {status} (p={val:.4f}). If violated, we use Welch's test.")
            
        if "normality" in assumptions:
            # simplified
            explanations.append("Normality: Checked via Shapiro-Wilk.")
            
        return explanations

    def _generate_methodology(self, res: Dict) -> str:
        """Tier 3 Text Generator"""
        test = res.get("test_used", "Statistical validation")
        p = res.get("p_value", "N/A")
        val = res.get("statistic", "N/A")
        
        return f"Statistical analysis was performed using {test}. The test statistic was {val:.4f} with a p-value of {p:.4f}. Assumptions were verified using Shapiro-Wilk and Levene's tests where appropriate. Significance was defined at alpha = 0.05."
