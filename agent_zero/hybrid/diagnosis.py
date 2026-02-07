"""
System Diagnosis - Tools for Agent Self-Awareness of Infrastructure.
"""
import logging
import asyncio
from typing import Dict, Any
from agent_zero.hybrid.tools.code_execution import SafeCodeExecutionTool

logger = logging.getLogger(__name__)

class SystemDiagnosis:
    """
    Provides health checks for the internal agent system.
    """
    
    def __init__(self):
        self.exec_tool = SafeCodeExecutionTool()
        
    async def check_health(self) -> Dict[str, Any]:
        """Run full system health check."""
        results = {}
        
        # 1. Disk Space
        rc, out, err = await self.exec_tool.execute_shell("df -h /")
        results["disk"] = out if rc == 0 else f"Error: {err}"
        
        # 2. Memory
        rc, out, err = await self.exec_tool.execute_shell("free -m")
        results["memory"] = out if rc == 0 else f"Error: {err}"
        
        # 3. Network (Connectivity)
        rc, out, err = await self.exec_tool.execute_shell("curl -I https://google.com --max-time 2")
        results["network"] = "Online" if rc == 0 else "Offline/Unreachable"
        
        # 4. Check API status (localhost port)
        # Using netstat or similar if available, else skip
        
        return results
        
    async def get_diagnosis_report(self) -> str:
        """Format health check as a readable report for the Agent."""
        data = await self.check_health()
        
        report = [
            "# System Diagnosis Report",
            f"**Network Status**: {data.get('network')}",
            "",
            "## Memory Usage",
            f"```\n{data.get('memory')}\n```",
            "",
            "## Disk Usage",
            f"```\n{data.get('disk')}\n```"
        ]
        
        return "\n".join(report)
