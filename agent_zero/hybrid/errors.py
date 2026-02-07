"""
Hybrid Errors - Exception classes for control flow and self-healing.
"""
import traceback
import asyncio
import re

class RepairableException(Exception):
    """
    An exception that the agent can attempt to fix itself.
    When caught, the agent's monologue loop will prompt the LLM with the error
    to generate a fix.
    """
    pass

class InterventionException(Exception):
    """
    Triggered when the user intervenes (pauses/sends message) during execution.
    Stops the current reasoning chain to process the new input.
    """
    pass

class HandledException(Exception):
    """
    An exception that has already been logged/handled and should stop execution
    without further processing.
    """
    pass

def format_error(e: Exception) -> str:
    """Format exception trace for LLM consumption."""
    return "".join(traceback.format_exception(type(e), e, e.__traceback__))
