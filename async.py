import asyncio
import sounddevice as sd
import numpy as np
import websockets
import queue

# WebSocket Server URL
WS_URL = "ws://192.168.1.96:8000/transcribe/"

# Audio Config
SAMPLE_RATE = 16000  # Match server settings
CHANNELS = 1  # Mono audio
CHUNK = 1024  # Buffer size

# Queue for audio frames
audio_queue = queue.Queue()
1
async def send_audio(websocket):
    """Asynchronously sends audio from queue to WebSocket."""
    while True:
        audio_data = await asyncio.get_event_loop().run_in_executor(None, audio_queue.get)
        await websocket.send(audio_data)

async def receive_transcription(websocket):
    """Receives real-time transcriptions from the WebSocket server."""
    async for message in websocket:
        print(f"📝 Transcription: {message}")

def audio_callback(indata, frames, time, status):
    """Captures audio and adds it to the queue."""
    if status:
        print(f"⚠️ Warning: {status}")
    audio_queue.put((indata * 32767).astype(np.int16).tobytes())

async def main():
    """Connects to WebSocket and manages audio streaming."""
    async with websockets.connect(WS_URL) as websocket:
        send_task = asyncio.create_task(send_audio(websocket))
        receive_task = asyncio.create_task(receive_transcription(websocket))

        print("🎤 Live audio streaming started... (Press Ctrl+C to stop)")
        with sd.InputStream(samplerate=SAMPLE_RATE, channels=CHANNELS, callback=audio_callback, blocksize=CHUNK):
            await asyncio.Future()  # Keep running forever

# Run the event loop
if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("🚪 Exiting...")