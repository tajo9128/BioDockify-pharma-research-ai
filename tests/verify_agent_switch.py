
import asyncio
import sys
import os

# Adjust path to include project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agent_zero.biodockify_ai import BioDockifyAI

async def verify_switching():
    print("Verifying Agent Switching Mechanism...")
    
    ai = BioDockifyAI()
    
    # 1. Initialize (Mock if needed, but here we try real init)
    # Note: This might verify dependencies, so ensure environment is set or mock
    # For now, we assume local environment is okay.
    print("Initializing AI...")
    try:
        await ai.initialize()
    except Exception as e:
        print(f"Initialization warning (might be expected in test env): {e}")

    # 2. Test Lite Mode (NanoBot)
    print("\n--- Test 1: Lite Mode (NanoBot) ---")
    try:
        response_lite = await ai.process_chat("Hello, who are you?", mode="lite")
        print(f"Response (Lite): {response_lite}")
        
        # Heuristic check: NanoBot usually responds shortly or with receptionist persona
        if "NanoBot" in response_lite or "Receptionist" in response_lite or "assist" in response_lite:
            print("[SUCCESS] Lite Mode seems to route to NanoBot/Receptionist.")
        else:
            print("[WARN] Lite Mode response ambiguous.")
            
    except Exception as e:
        print(f"[ERROR] Lite Mode Failed: {e}")

    # 3. Test Hybrid Mode (Agent Zero)
    print("\n--- Test 2: Hybrid Mode (Agent Zero) ---")
    try:
        # We need to mock the agent.chat if we don't want real LLM calls, 
        # but let's try to see if it routes correctly.
        # If Agent Zero is not fully configured, this might fail, which confirms routing!
        
        if ai.agent:
            # Inject a mock chat function to avoid spending tokens/time
            original_chat = ai.agent.chat
            async def mock_chat(msg):
                return f"[Agent Zero] Processed: {msg}"
            ai.agent.chat = mock_chat
            
            response_hybrid = await ai.process_chat("Analyze this.", mode="hybrid")
            print(f"Response (Hybrid): {response_hybrid}")
            
            if "[Agent Zero]" in response_hybrid:
                print("[SUCCESS] Hybrid Mode routed to Agent Zero.")
            else:
                print("[ERROR] Hybrid Mode did NOT route to Agent Zero.")
                
            # Restore
            ai.agent.chat = original_chat
        else:
             print("[WARN] Agent Zero not initialized, cannot verify routing destination, but code path exists.")

    except Exception as e:
        print(f"[ERROR] Hybrid Mode Failed: {e}")

if __name__ == "__main__":
    asyncio.run(verify_switching())
