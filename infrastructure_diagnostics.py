#!/usr/bin/env python3
"""
Infrastructure & System Support Diagnostics
Tests the following modules without Neo4j dependency:
1. System Doctor - Self-healing diagnostics
2. SurfSense - Web-sensing engine for clinical trial monitoring
3. Backup - Encrypted cloud backup (Google Drive)
4. Graph Builder - Neo4j-free operation verification
"""

import asyncio
import logging
import sys
import os
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("InfrastructureDiagnostics")

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


class InfrastructureDiagnostics:
    """Comprehensive diagnostics for infrastructure modules."""
    
    def __init__(self):
        self.results = {
            "system_doctor": {"status": "pending", "issues": []},
            "surfsense": {"status": "pending", "issues": []},
            "backup": {"status": "pending", "issues": []},
            "graph_builder": {"status": "pending", "issues": []}
        }
    
    async def run_all_diagnostics(self):
        """Run all infrastructure diagnostics."""
        logger.info("=" * 60)
        logger.info("INFRASTRUCTURE & SYSTEM SUPPORT DIAGNOSTICS")
        logger.info("=" * 60)
        
        # 1. Test System Doctor
        await self._test_system_doctor()
        
        # 2. Test SurfSense
        await self._test_surfsense()
        
        # 3. Test Backup Module
        await self._test_backup()
        
        # 4. Test Graph Builder (Neo4j-free)
        await self._test_graph_builder()
        
        # Print summary
        self._print_summary()
    
    async def _test_system_doctor(self):
        """Test System Doctor module."""
        logger.info("\n" + "-" * 40)
        logger.info("TESTING: System Doctor")
        logger.info("-" * 40)
        
        try:
            from modules.system.doctor import SystemDoctor
            logger.info("✓ SystemDoctor imported successfully")
            
            # Test with mock config
            config = {
                "ai_provider": {
                    "mode": "auto",
                    "ollama_url": "http://localhost:11434"
                }
            }
            
            doctor = SystemDoctor(config)
            logger.info("✓ SystemDoctor initialized")
            
            # Run diagnosis
            report = doctor.run_diagnosis()
            logger.info(f"✓ Diagnosis completed. Status: {report.get('status')}")
            logger.info(f"  - Checks performed: {list(report.get('checks', {}).keys())}")
            logger.info(f"  - Issues found: {len(report.get('issues', []))}")
            
            for issue in report.get('issues', []):
                logger.warning(f"  Issue: {issue.get('message')} (Severity: {issue.get('severity')})")
            
            self.results["system_doctor"]["status"] = "passed"
            
        except Exception as e:
            logger.error(f"✗ System Doctor test failed: {e}")
            self.results["system_doctor"]["status"] = "failed"
            self.results["system_doctor"]["issues"].append(str(e))
        
        # Test Connection Doctor
        try:
            from modules.system.connection_doctor import ConnectionDoctor, CheckStatus
            logger.info("\n  Testing ConnectionDoctor...")
            
            conn_doc = ConnectionDoctor()
            logger.info("  ✓ ConnectionDoctor initialized")
            
            # Test internet connectivity
            internet_result = await conn_doc.check_internet()
            logger.info(f"  ✓ Internet check: {internet_result.status.value}")
            
            # Test LM Studio detection (without auto-start)
            lm_result = await conn_doc.check_lm_studio(auto_start=False)
            logger.info(f"  ✓ LM Studio check: {lm_result.status.value}")
            
            self.results["system_doctor"]["connection_doctor"] = "passed"
            
        except Exception as e:
            logger.error(f"  ✗ Connection Doctor test failed: {e}")
            self.results["system_doctor"]["connection_doctor"] = "failed"
            self.results["system_doctor"]["issues"].append(f"ConnectionDoctor: {e}")
    
    async def _test_surfsense(self):
        """Test SurfSense web-sensing engine."""
        logger.info("\n" + "-" * 40)
        logger.info("TESTING: SurfSense Web-Sensing Engine")
        logger.info("-" * 40)
        
        try:
            from agent_zero.web_research.surfsense import SurfSense, CrawlConfig, ExtractionRules
            logger.info("✓ SurfSense imported successfully")
            
            # Initialize SurfSense
            surfsense = SurfSense()
            logger.info("✓ SurfSense initialized")
            
            # Test default rules creation
            default_rules = surfsense.create_default_rules()
            logger.info(f"✓ Default rules created: {len(default_rules.selectors)} selectors")
            
            # Test medical rules creation
            medical_rules = surfsense.create_medical_rules()
            logger.info(f"✓ Medical rules created: {len(medical_rules.selectors)} selectors")
            
            # Test link extraction (without actual HTTP request)
            test_html = """
            <html>
                <body>
                    <a href="https://example.com/page1">Link 1</a>
                    <a href="/relative/path">Link 2</a>
                    <a href="javascript:void(0)">JS Link</a>
                    <a href="mailto:test@example.com">Email</a>
                </body>
            </html>
            """
            links = surfsense._extract_links(test_html, "https://example.com")
            logger.info(f"✓ Link extraction test: {len(links)} valid links found")
            
            # Test extraction rules application
            test_content = "<script>alert('test')</script><p>Hello World</p>   "
            import asyncio
            
            # Create a simple test for apply_extraction_rules
            loop = asyncio.get_event_loop()
            result = await surfsense.apply_extraction_rules(test_content, default_rules)
            logger.info(f"✓ Content cleaning test: '{result[:50]}...'")
            
            self.results["surfsense"]["status"] = "passed"
            
        except Exception as e:
            logger.error(f"✗ SurfSense test failed: {e}")
            import traceback
            traceback.print_exc()
            self.results["surfsense"]["status"] = "failed"
            self.results["surfsense"]["issues"].append(str(e))
    
    async def _test_backup(self):
        """Test Backup module (encrypted cloud backup)."""
        logger.info("\n" + "-" * 40)
        logger.info("TESTING: Backup Module (Google Drive)")
        logger.info("-" * 40)
        
        try:
            from modules.backup.manager import BackupManager
            from modules.backup.drive_client import DriveClient
            from modules.backup.crypto import BackupCrypto, is_crypto_available
            logger.info("✓ Backup modules imported successfully")
            
            # Test DriveClient
            drive = DriveClient(storage_path="test_mock_drive")
            logger.info("✓ DriveClient initialized")
            
            # Test authentication flow
            auth_url = drive.get_auth_url()
            logger.info(f"✓ Auth URL generated: {auth_url[:50]}...")
            
            # Simulate authentication
            auth_result = drive.authenticate("test_auth_code")
            logger.info(f"✓ Authentication result: {auth_result}")
            
            # Test connection status
            is_connected = drive.is_connected()
            logger.info(f"✓ Connection status: {is_connected}")
            
            # Test user info
            user_info = drive.get_user_info()
            logger.info(f"✓ User info retrieved: {user_info.get('email')}")
            
            # Test BackupCrypto
            crypto = BackupCrypto(password="test_password_123")
            logger.info("✓ BackupCrypto initialized")
            
            crypto_available = is_crypto_available()
            logger.info(f"✓ Encryption available: {crypto_available}")
            
            # Test BackupManager
            manager = BackupManager(drive)
            logger.info("✓ BackupManager initialized")
            
            # Test backup creation (with mock data)
            test_dir = Path("test_backup_data")
            test_dir.mkdir(exist_ok=True)
            (test_dir / "test_file.txt").write_text("Test backup content")
            
            backup_result = manager.create_backup([str(test_dir)])
            logger.info(f"✓ Backup creation result: {backup_result.get('status')}")
            
            # Cleanup
            import shutil
            shutil.rmtree(test_dir, ignore_errors=True)
            shutil.rmtree("test_mock_drive", ignore_errors=True)
            
            self.results["backup"]["status"] = "passed"
            
        except Exception as e:
            logger.error(f"✗ Backup test failed: {e}")
            import traceback
            traceback.print_exc()
            self.results["backup"]["status"] = "failed"
            self.results["backup"]["issues"].append(str(e))
    
    async def _test_graph_builder(self):
        """Test Graph Builder module (Neo4j-free operation)."""
        logger.info("\n" + "-" * 40)
        logger.info("TESTING: Graph Builder (Neo4j-Free)")
        logger.info("-" * 40)
        
        try:
            from modules.graph_builder import Neo4jLoader, NEO4J_AVAILABLE
            from modules.graph_builder.loader import get_loader, add_paper, connect_compound
            logger.info("✓ Graph Builder modules imported successfully")
            
            # Verify Neo4j is not required
            logger.info(f"✓ NEO4J_AVAILABLE flag: {NEO4J_AVAILABLE}")
            
            if not NEO4J_AVAILABLE:
                logger.info("✓ Neo4j dependency correctly disabled")
            
            # Test Neo4jLoader initialization (should work without Neo4j)
            loader = Neo4jLoader()
            logger.info("✓ Neo4jLoader initialized (Neo4j-free mode)")
            
            # Test connection attempt (should gracefully skip)
            loader.connect()
            logger.info(f"✓ Connection attempt completed. Connected: {loader._connected}")
            
            # Test query execution (should return None gracefully)
            result = loader.execute_query("MATCH (n) RETURN n LIMIT 1")
            logger.info(f"✓ Query execution result: {result}")
            
            # Test convenience functions
            add_paper_result = add_paper({"pmid": "TEST123", "title": "Test Paper"})
            logger.info("✓ add_paper convenience function executed")
            
            connect_compound_result = connect_compound("TEST123", "Aspirin")
            logger.info("✓ connect_compound convenience function executed")
            
            # Test that server.py won't fail due to neo4j import
            logger.info("\n  Checking server.py neo4j handling...")
            server_path = Path(__file__).parent / "server.py"
            if server_path.exists():
                content = server_path.read_text()
                if "import neo4j" in content:
                    logger.warning("  ⚠ server.py has hard 'import neo4j' - this may cause issues")
                    logger.warning("  ⚠ Consider making this import optional")
                else:
                    logger.info("  ✓ server.py doesn't have hard neo4j dependency")
            
            self.results["graph_builder"]["status"] = "passed"
            
        except Exception as e:
            logger.error(f"✗ Graph Builder test failed: {e}")
            import traceback
            traceback.print_exc()
            self.results["graph_builder"]["status"] = "failed"
            self.results["graph_builder"]["issues"].append(str(e))
    
    def _print_summary(self):
        """Print diagnostic summary."""
        logger.info("\n" + "=" * 60)
        logger.info("DIAGNOSTIC SUMMARY")
        logger.info("=" * 60)
        
        all_passed = True
        for module, result in self.results.items():
            status = result["status"]
            icon = "✓" if status == "passed" else "✗" if status == "failed" else "?"
            logger.info(f"{icon} {module.upper()}: {status.upper()}")
            
            if result["issues"]:
                all_passed = False
                for issue in result["issues"]:
                    logger.warning(f"   - Issue: {issue}")
        
        logger.info("=" * 60)
        if all_passed:
            logger.info("OVERALL: All infrastructure modules operational")
        else:
            logger.warning("OVERALL: Some modules have issues that need attention")
        logger.info("=" * 60)


async def main():
    """Run infrastructure diagnostics."""
    diagnostics = InfrastructureDiagnostics()
    await diagnostics.run_all_diagnostics()


if __name__ == "__main__":
    asyncio.run(main())
