
import imageio_ffmpeg
import asyncio
from playwright.async_api import async_playwright

async def verify():
    print("--- Verifying FFmpeg ---")
    try:
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        print(f"FFmpeg EXE: {ffmpeg_exe}")
        if ffmpeg_exe and "ffmpeg" in ffmpeg_exe.lower():
            print("FFmpeg detected.")
        else:
            print("FFmpeg NOT detected correctly.")
    except Exception as e:
        print(f"FFmpeg Check Error: {e}")

    print("\n--- Verifying Playwright Browser Launch ---")
    try:
        async with async_playwright() as p:
            print("Launching Chromium...")
            browser = await p.chromium.launch()
            print("SUCCESS: Chromium launched successfully.")
            await browser.close()
    except Exception as e:
        print(f"Playwright Launch Error: {e}")

if __name__ == "__main__":
    asyncio.run(verify())
