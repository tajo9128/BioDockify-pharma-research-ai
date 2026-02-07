"""
Test Hybrid AI Integration.
"""
import sys
import os
import asyncio
import logging

# Add current dir to path
sys.path.append(os.getcwd())

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_integration():
    try:
        # Mock missing dependencies to avoid environment errors in test
        sys.modules['litellm'] = type('MockLiteLLM', (), {'completion': None})
        sys.modules['arxiv'] = type('MockArxiv', (), {})
        sys.modules['pymupdf'] = type('MockPyMuPDF', (), {})
        sys.modules['fitz'] = type('MockFitz', (), {})
        # Correctly mock Bio.Entrez
        mock_entrez = type('MockEntrez', (), {'email': None})
        sys.modules['Bio'] = type('MockBio', (), {'Entrez': mock_entrez})

        # Correctly mock semanticscholar package structure
        class MockSemanticScholarClass:
            def __init__(self, *args, **kwargs):
                pass
        
        mock_sem = type('MockSemanticScholar', (), {'SemanticScholar': MockSemanticScholarClass})
        sys.modules['semanticscholar'] = mock_sem
        
        mock_sklearn = type('MockSklearn', (), {'__path__': []})
        mock_feat = type('MockFeatureExtraction', (), {'__path__': []})
        
        class MockTfidfClass:
            def __init__(self, *args, **kwargs):
                pass
            def fit_transform(self, X):
                return [[0]]
        
        mock_text = type('MockText', (), {'TfidfVectorizer': MockTfidfClass, '__path__': []})
        mock_metrics = type('MockMetrics', (), {'cosine_similarity': lambda x, y: [[0.5]], '__path__': []})
        mock_pairwise = type('MockPairwise', (), {'cosine_similarity': lambda x, y: [[0.5]], '__path__': []})
        
        mock_metrics.pairwise = mock_pairwise
        mock_feat.text = mock_text
        mock_sklearn.feature_extraction = mock_feat
        mock_sklearn.metrics = mock_metrics
        
        sys.modules['sklearn'] = mock_sklearn
        sys.modules['sklearn.feature_extraction'] = mock_feat
        sys.modules['sklearn.feature_extraction.text'] = mock_text
        sys.modules['sklearn.metrics'] = mock_metrics
        sys.modules['sklearn.metrics.pairwise'] = mock_pairwise
        
        # Mock numpy
        sys.modules['numpy'] = type('MockNumpy', (), {'array': lambda x: x})

        logger.info("1. Testing BioDockify AI Initialization...")
        from agent_zero.biodockify_ai import get_biodockify_ai
        
        ai = get_biodockify_ai()
        await ai.initialize()
        
        logger.info("2. Testing Hybrid Agent Core...")
        if not ai.agent:
            raise Exception("Agent failed to initialize")
            
        logger.info("3. Testing Components...")
        # Check Memory
        if not ai.agent.memory:
            raise Exception("Memory module missing")
            
        # Check Context
        if not ai.agent.context:
            raise Exception("Context module missing")
            
        # Check Tools Load (Placeholder)
        # ai.agent.tools should be loaded
        
        logger.info("✓ Core Integration Successful")
        
        logger.info("4. Testing Chat Interface (Dry Run)...")
        # We can't really call LM Studio in CI/Test without it running
        # But we can check if the method exists
        if not hasattr(ai, 'process_chat'):
             raise Exception("Chat interface missing")
             
        logger.info("✓ Chat Interface Ready")
        
    except Exception as e:
        logger.error(f"Integration Test Failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_integration())
