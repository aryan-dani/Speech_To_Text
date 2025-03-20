import gradio as gr
import aiohttp
import asyncio
import json
import numpy as np
import base64

# Whisper API URL (from Docker Compose)
WHISPER_API_URL = "http://whisper:8000/transcribe_file"
WHISPER_WS_URL = "ws://whisper:8000/transcribe"

# Ollama API URL (from Docker Compose)
OLLAMA_API_URL = "http://ollama:11434/api/chat"

async def transcribe_audio_file(file_path):
    try:
        async with aiohttp.ClientSession() as session:
            with open(file_path, "rb") as audio_file:
                form_data = aiohttp.FormData()
                form_data.add_field("file", audio_file, filename="audio.wav", content_type="audio/wav")
                async with session.post(WHISPER_API_URL, data=form_data) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result.get("transcription", "Transcription failed")
                    else:
                        return f"Error: {response.status}"
    except Exception as e:
        return f"Exception: {str(e)}"
    
async def transcribe_audio_stream(audio_data):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.ws_connect(WHISPER_WS_URL) as ws:
                audio_np = np.array(audio_data, dtype=np.float32)
                audio_b64 = base64.b64encode(audio_np.tobytes()).decode('utf-8')
                await ws.send_json({"audio": audio_b64})
                msg = await ws.receive_text()
                yield msg
    except Exception as e:
        yield f"WebSocket Error: {e}"

async def ask_llama(context=" ", query=" "):
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
           "content": query
       },
       {
           "role": "user",
           "content": "Summerize the Brief Patient medical Hisotry from entire conversation in one sentence, List down the chief complaints in comma seperated values only, History of the complaint to the user like ODP/HPI,Medicine history for current complaint that patient has taken or tried, Past Medical history of patient that happened before this issue, Hospitalization and Surgical history of the patient if any, Life style and social history of the patient, family medical history of the patient that can help in the investigation, Explain the allergies and hypersensitivity of the patient if present."
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
           "temperature": 0.1
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

def process_audio(file_path):
    return asyncio.run(transcribe_audio_file(file_path))

async def consume_generator(generator):
    full_string = ""
    async for item in generator:
        print(item)
        full_string += item + " "
    return full_string

def process_audio_stream(audio_data):
    generator_object = transcribe_audio_stream(audio_data)
    full_string = asyncio.run(consume_generator(generator_object))
    return full_string

def generate_summary(transcription):
    response = asyncio.run(ask_llama(transcription, ""))
    try:
        response_content = json.loads(response)
        return (
            response_content.get("brief_medical_history", "N/A"),
            response_content.get("chief_complaints", {}).get("Complaint", "N/A"),
            response_content.get("chief_complaints", {}).get("Duration", "N/A"),
            response_content.get("chief_complaints", {}).get("Description", "N/A"),
            response_content.get("current_symptoms_and_medical_background", "N/A"),
            response_content.get("past_medical_history", {}).get("Diagnosis Type", "N/A"),
            response_content.get("past_medical_history", {}).get("Disease", "N/A"),
            response_content.get("hospitalization_and_surgical_history", {}).get("Diagnosis", "N/A"),
            response_content.get("hospitalization_and_surgical_history", {}).get("Treatment", "N/A"),
            response_content.get("hospitalization_and_surgical_history", {}).get("Admission Time", "N/A"),
            response_content.get("gynecological_history", "N/A"),
            response_content.get("lifestyle_and_social_activity", {}).get("Physical Activity", "N/A"),
            response_content.get("lifestyle_and_social_activity", {}).get("Time", "N/A"),
            response_content.get("lifestyle_and_social_activity", {}).get("Status", "N/A"),
            response_content.get("family_history", {}).get("Relation", "N/A"),
            response_content.get("family_history", {}).get("Disease Name", "N/A"),
            str(response_content.get("family_history", {}).get("Age", "N/A")),
            response_content.get("allergies_and_hypersensitivities", {}).get("Allergy", "N/A"),
            response_content.get("allergies_and_hypersensitivities", {}).get("Allergen", "N/A"),
            response_content.get("allergies_and_hypersensitivities", {}).get("Type of Reaction", "N/A"),
            response_content.get("allergies_and_hypersensitivities", {}).get("Severity", "N/A"),
        )
    except json.JSONDecodeError:
        return tuple(["Invalid JSON response from Ollama" for _ in range(21)])

def talk_with_ai(transcription, query):
    response = asyncio.run(ask_llama1(transcription, query))
    return response
    
with gr.Blocks() as demo:
    gr.Markdown("# 🏥 Patient Medical History AI")

    with gr.Row():
        audio_input = gr.Audio(sources=["upload","microphone"], type="filepath", label="Audio Input")
        transcribe_button = gr.Button("Transcribe")

    transcription_output = gr.Textbox(label="Transcription", interactive=True)

    with gr.Row():
        summary_button = gr.Button("Generate Full Summary")
        talk_button = gr.Button("Talk with AI")

    with gr.Accordion("Talk with AI", open=False):
        user_query = gr.Textbox(label="Your Query")
        ai_response = gr.Textbox(label="AI Response", interactive=True)

    with gr.Accordion("Patient Medical History", open=True):
        with gr.Row():
            brief_medical_history = gr.Textbox(label="📝 Brief Medical History", interactive=True)

        with gr.Accordion("Chief Complaints"):
            chief_complaint = gr.Textbox(label="Complaint", interactive=True)
            duration = gr.Textbox(label="Duration", interactive=True)
            description = gr.Textbox(label="Description", interactive=True)
        
        with gr.Accordion("Current Symptoms and Medical Background"):
            current_symptoms = gr.Textbox(label="Current Symptoms", interactive=True)
        
        with gr.Accordion("Gynecological History"):
            gynecological_history = gr.Textbox(label="Gynecological History", interactive=True)
        
        with gr.Accordion("Lifestyle and Social Activity"):
            physical_activity = gr.Textbox(label="Physical Activity", interactive=True)
            time = gr.Textbox(label="Time", interactive=True)
            status = gr.Textbox(label="Status", interactive=True)
        
        with gr.Accordion("Family History"):
            relation = gr.Textbox(label="Relation", interactive=True)
            disease_name = gr.Textbox(label="Disease Name", interactive=True)
            age = gr.Textbox(label="Age", interactive=True)
        
        with gr.Accordion("Past Medical History"):
            diagnosis_type = gr.Textbox(label="Diagnosis Type", interactive=True)
            disease = gr.Textbox(label="Disease", interactive=True)
        
        with gr.Accordion("Hospitalization & Surgery"):
            hospitalization_diagnosis = gr.Textbox(label="Diagnosis", interactive=True)
            treatment = gr.Textbox(label="Treatment", interactive=True)
            admission_time = gr.Textbox(label="Admission Time", interactive=True)
        
        with gr.Accordion("Allergies & Hypersensitivities"):
            allergy = gr.Textbox(label="Allergy", interactive=True)
            allergen = gr.Textbox(label="Allergen", interactive=True)
            reaction_type = gr.Textbox(label="Type of Reaction", interactive=True)
            severity = gr.Textbox(label="Severity", interactive=True)
    
    transcribe_button.click(process_audio, inputs=audio_input, outputs=transcription_output)
    summary_button.click(generate_summary, inputs=transcription_output, outputs=[
        brief_medical_history, chief_complaint, duration, description, current_symptoms,
        diagnosis_type, disease, hospitalization_diagnosis, treatment, admission_time,
        gynecological_history, physical_activity, time, status, relation, disease_name, age,
        allergy, allergen, reaction_type, severity
    ])
    talk_button.click(talk_with_ai, inputs=[transcription_output, user_query], outputs=ai_response)
    audio_input.change(process_audio_stream, inputs=[audio_input], outputs=transcription_output) #Real time transcription enabled.


if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860,ssl_verify=False,ssl_certfile='cert.pem',ssl_keyfile='key.pem')