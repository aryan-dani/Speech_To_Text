import torch
import torchaudio
import numpy as np
import json
import asyncio
import aiohttp
from io import BytesIO
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from faster_whisper import WhisperModel
from starlette.websockets import WebSocketState
from fastapi.middleware.cors import CORSMiddleware

OLLAMA_API_URL = "http://192.168.1.95:11434/api/chat"

# Load the Whisper model
from faster_whisper import WhisperModel

# Load model with workers here
from faster_whisper import WhisperModel

# Load model with correct multi-threading args
model = WhisperModel("large-v2", 
                     device="cuda", 
                     compute_type="int8"
                    #  ,cpu_threads=8
                    )   # For multi-threading within CUDA core

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

def ASR(audio):
    """Transcribe the audio into text."""
    segments, _ = model.transcribe(audio, task="translate", beam_size=1,vad_filter=True)# word_timestamps=False)
    text = " ".join(segment.text.strip() for segment in segments)
    return text

async def ask_llama(context=" ", query=" "):
    """Query Ollama API to generate medical summary."""
    headers = {"Content-Type": "application/json"}
    payload = {
   "model": "llama3.2",
   "messages": [
       {
           "role": "system",
           "content": "You are a doctor."
       },
       {
           "role": "user",
           "content": context
       },
       {
           "role": "user",
           "content": "Summerize the Brief Patient medical Hisotry from entire conversation in one sentence, List down the chief complaints in comma seperated values only, History of the complaint to the user like ODP/HPI,Medicine history for current complaint that patient has taken or tried, Past Medical history of patient that happened before this issue, Hospitalization and Surgical history of the patient if any, Gynecological History of the patient if any, Life style and social history of the patient, family medical history of the patient that can help in the investigation, Explain the allergies and hypersensitivity of the patient if present."
       }
   ],
   "format": {
       "type": "object",
       "properties": {
           "brief_medical_history": {
               "type": "string"
           },
           "chief_complaints": {
               "type": "object",
               "properties": {
                   "Complaint": {
                       "type": "string"
                   },
                   "Duration": {
                       "type": "string"
                   },
                   "Description": {
                       "type": "string"
                   }
               },
               "required": [
                   "Complaint",
                   "Duration",
                   "Description"
               ]
           },
           "current_symptoms_and_medical_background": {
               "type": "string"
           },
           "past_medical_history": {
               "type": "object",
               "properties": {
                   "Diagnosis Type": {
                       "type": "string",
                       "enum": [
                           "Clinical",
                           "Differential",
                           "Final",
                           "Provisional",
                           "Suspected"
                       ]
                   },
                   "Disease": {
                       "type": "string"
                   }
               },
               "required": [
                   "Diagnosis Type",
                   "Disease"
               ]
           },
           "hospitalization_and_surgical_history": {
               "type": "object",
               "properties": {
                   "Diagnosis": {
                       "type": "string"
                   },
                   "Treatment": {
                       "type": "string"
                   },
                   "Admission Time": {
                       "type": "string"
                   }
               },
               "required": [
                   "Diagnosis",
                   "Treatment",
                   "Admision Time"
               ]
           },
           "gynecological_history": {
               "type": "string"
           },
           "lifestyle_and_social_activity": {
               "type": "object",
               "properties": {
                   "Physical Activity": {
                       "type": "string"
                   },
                   "Time": {
                       "type": "string"
                   },
                   "Status": {
                       "type": "string"
                   }
               },
               "required": [
                   "Physcial Activity",
                   "Time",
                   "Status"
               ]
           },
           "family_history": {
               "type": "object",
               "properties": {
                   "Relation": {
                       "type": "string"
                   },
                   "Disease Name": {
                       "type": "string"
                   },
                   "Age": {
                       "type": "number"
                   }
               },
               "required": [
                   "Relation",
                   "Disease Name",
                   "Age"
               ]
           },
           "allergies_and_hypersensitivities": {
               "type": "object",
               "properties": {
                   "Allergy": {
                       "type": "string"
                   },
                   "Allergen": {
                       "type": "string"
                   },
                   "Type of Reaction": {
                       "type": "string"
                   },
                   "Status": {
                       "type": "string",
                       "enum": [
                           "active",
                           "passive"
                       ]
                   },
                   "Severity": {
                       "type": "string"
                   }
               },
               "required": [
                   "Allergy",
                   "Allergen",
                   "Type of Reaction",
                   "Severity"
               ]
           }
       },
       "required": [
           "brief_medical_history",
           "chief_complaints",
           "current_symptoms_and_medical_background",
           "past_medical_history",
           "hospitalization_and_surgical_history",
           "gynecological_history",
           "lifestyle_and_social_activity",
           "family_history",
           "allergies_and_hypersensitivities"
       ],
     
       "option": {
           "temperature": 0.0
       }
   },
   "stream": False
}


    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(OLLAMA_API_URL, json=payload, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("message", {}).get("content", "No response from Ollama")
                else:
                    return f"Error: {response.status}"
    except Exception as e:
        return f"Exception: {str(e)}"
    
async def ask_llama1(context, query=" "):
    headers = {'Content-Type': 'application/json'}
    payload = {
        "model": "llama3.2",
        "messages": [
            {"role": "system", "content": "You are a doctor.just talk to the patient"},
            {"role": "user", "content": context},
            {"role": "user", "content": query},
        ],
        "stream": False
    }


    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(OLLAMA_API_URL, json=payload, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("message", {}).get("content", "No response from Ollama")
                else:
                    return f"Error: {response.status}"
    except Exception as e:
        return f"Exception: {str(e)}"

import numpy as np
import soundfile as sf
import io

async def transcribe_async(audio_array):
    """Run Faster-Whisper in a background task"""
    return await asyncio.to_thread(ASR, audio_array.astype(np.float32))  # Run ASR in a separate thread

@app.websocket("/transcribe/")
async def transcribe_audio(websocket: WebSocket):
    await websocket.accept()
    audio_queue = []
    sample_rate = 16000
    buffer_size = sample_rate * 1  # 1 second buffer

    try:
        while True:
            audio_bytes = await websocket.receive_bytes()

            # Ensure correct PCM chunk size
            if len(audio_bytes) % 2 != 0:
                audio_bytes += b'\x00'

            # Convert PCM to float32
            audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            audio_queue.append(audio_array)

            # Process when buffer is full
            if sum(len(chunk) for chunk in audio_queue) >= buffer_size:
                combined_audio = np.concatenate(audio_queue)
                audio_queue.clear()

                # Run transcription in background
                transcription_task = asyncio.create_task(transcribe_async(combined_audio))
                asyncio.create_task(send_transcription(websocket, transcription_task))

    except WebSocketDisconnect:
        print("Client disconnected")

async def send_transcription(websocket, transcription_task):
    transcription = await transcription_task  # Wait for ASR to finish
    await websocket.send_text(transcription)  # Send back to client



# @app.websocket("/transcribe/")
# async def transcribe_audio(websocket: WebSocket):
#     await websocket.accept()
#     audio_buffer = BytesIO()
#     state_transcription = ""

#     sample_rate = 16000
#     duration = 5  # Buffer duration in seconds
#     buffer_size = sample_rate * 2 * duration  # 2 bytes for int16 PCM

#     try:
#         while True:
#             audio_bytes = await websocket.receive_bytes()
#             audio_buffer.write(audio_bytes)

#             if audio_buffer.tell() >= buffer_size:
#                 # Load audio from buffer
#                 audio_buffer.seek(0)
#                 audio_tensor, sr = torchaudio.load(audio_buffer, normalize=False)
#                 audio_buffer.truncate(0)
#                 audio_buffer.seek(0)

#                 # Convert stereo to mono
#                 if audio_tensor.shape[0] > 1:
#                     audio_tensor = audio_tensor.mean(dim=0)

#                 # Resample to 16kHz
#                 if sr != sample_rate:
#                     resampler = torchaudio.transforms.Resample(orig_freq=sr, new_freq=16000)
#                     audio_tensor = resampler(audio_tensor)

#                 # Convert to numpy
#                 audio_data = audio_tensor.numpy().flatten()

#                 # Send to Whisper ASR
#                 segments, _ = model.transcribe(audio_data, language="en", vad_filter=True)
                
#                 for segment in segments:
#                     state_transcription += " " + segment.text
                
#                 await websocket.send_text(state_transcription)

#     except WebSocketDisconnect:
#         print("Client disconnected")
#         await websocket.close()

# @app.websocket("/transcribe/")
# async def transcribe_audio(websocket: WebSocket):
#     """Real-time WebSocket connection for audio transcription."""
#     await websocket.accept()
#     state_transcription = ""

#     try:
#         while True:
#             audio_bytes = await websocket.receive_bytes()
#             audio_tensor, sample_rate = torchaudio.load(BytesIO(audio_bytes), normalize=True)
            
#             if audio_tensor.dim() > 1:
#                 audio_tensor = audio_tensor.mean(dim=0)
            
#             if sample_rate != 16000:
#                 resampler = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=16000)
#                 audio_tensor = resampler(audio_tensor)
            
#             waveform_np = audio_tensor.numpy()
#             waveform_np = waveform_np / np.max(np.abs(waveform_np))
            
#             text = ASR(waveform_np)
#             state_transcription += " " + text.strip()
#             await websocket.send_text(state_transcription)

#     except WebSocketDisconnect:
#         print("Client disconnected")
#         await websocket.close()




@app.websocket("/generate_summary/")
async def generate_summary_api(websocket: WebSocket):
    """WebSocket for generating summary in real-time."""
    await websocket.accept()
    
    try:
        while True:
            transcription = await websocket.receive_text()
            summary = await ask_llama(transcription, "")
            await websocket.send_json(summary)
    
    except WebSocketDisconnect:
        print("Client disconnected")
        await websocket.close()

@app.websocket("/talk_with_ai/")
async def talk_with_ai_api(websocket: WebSocket):
    """WebSocket for interacting with AI based on transcription."""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            transcription = data.get("transcription")
            query = data.get("query")
            response = await ask_llama1(transcription, query)
            print(response)
            await websocket.send_text(response)
    
    except WebSocketDisconnect:
        print("Client disconnected")
        await websocket.close()

@app.post("/upload/")
async def upload_audio(file: UploadFile = File(...)):
    """Upload an audio file and get the transcription."""
    audio_bytes = await file.read()
    audio_tensor, sample_rate = torchaudio.load(BytesIO(audio_bytes), normalize=True)
    
    if audio_tensor.dim() > 1:
        audio_tensor = audio_tensor.mean(dim=0)
    
    if sample_rate != 16000:
        resampler = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=16000)
        audio_tensor = resampler(audio_tensor)
    
    waveform_np = audio_tensor.numpy()
    waveform_np = waveform_np / np.max(np.abs(waveform_np))
    
    text = ASR(waveform_np)
    # print(text)
    return {"filename": file.filename, "transcription": text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
