
import asyncio
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

# Add project root to path
sys.path.append(os.getcwd())

async def test_audio():
    print("\n--- Testing Audio Generation ---")
    try:
        from modules.surfsense.audio import generate_podcast_audio
        
        # Mock OpenAI to avoid needing real keys/cost
        with patch('modules.surfsense.audio.OpenAI') as MockClient:
            mock_instance = MockClient.return_value
            mock_response = MagicMock()
            mock_instance.audio.speech.create.return_value = mock_response
            
            # Simulate stream_to_file
            def side_effect(path):
                with open(path, 'w') as f:
                    f.write("mock audio data")
            mock_response.stream_to_file.side_effect = side_effect
            
            output = await generate_podcast_audio("Hello World", output_path="test_audio.mp3", api_key="mock-key")
            print(f"SUCCESS: Audio generated at: {output}")
            return output
            
    except Exception as e:
        print(f"ERROR: Audio Test Failed: {str(e)}")
        return None

async def test_slides():
    print("\n--- Testing Slide Generation ---")
    try:
        from modules.surfsense.slides import generate_slides
        
        markdown = """
# Slide 1
- Point A
- Point B
---
# Slide 2
- Point C
        """
        
        output_dir = "test_slides_output"
        slides = await generate_slides(markdown, output_dir=output_dir)
        print(f"SUCCESS: Generated {len(slides)} slides at: {output_dir}")
        for s in slides:
            print(f"  - {s}")
        return slides
        
    except Exception as e:
        print(f"ERROR: Slide Test Failed: {str(e)}")
        return []

async def test_video(slides, audio_path):
    print("\n--- Testing Video Generation ---")
    if not slides or not audio_path:
        print("SKIP: Skipping Video Test (Missing inputs)")
        return

    try:
        from modules.surfsense.video import create_video_summary
        
        # We need a real audio file for ffmpeg probe, so create a dummy one if mock failed or was mock
        if not os.path.exists(audio_path) or os.path.getsize(audio_path) < 100:
             # Create a valid (but empty/silent) mp3 or just accept failure if ffmpeg probes it
             # Actually, let's mock ffmpeg.probe too since we don't have real audio
             pass

        with patch('modules.surfsense.video.ffmpeg.probe') as mock_probe:
            mock_probe.return_value = {'format': {'duration': '10.0'}}
            
            with patch('modules.surfsense.video.ffmpeg.output') as mock_output:
                mock_run = MagicMock()
                mock_output.return_value.overwrite_output.return_value.run = mock_run
                
                output = await create_video_summary(slides, audio_path, output_path="test_video.mp4")
                print(f"SUCCESS: Video generated at: {output}")
                
    except Exception as e:
        print(f"ERROR: Video Test Failed: {str(e)}")

async def main():
    print("Starting SurfSense Verification...")
    
    audio_path = await test_audio()
    slides = await test_slides()
    await test_video(slides, audio_path)
    
    print("\nVerification Complete.")

if __name__ == "__main__":
    asyncio.run(main())
