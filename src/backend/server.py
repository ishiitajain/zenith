import os
import json
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Valora Backend Server")

# Allow Frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AlertPayload(BaseModel):
    sos_triggered: bool
    timestamp: float
    camera_frame: str

# Simple in-memory Data Store for Hackathon Speed
active_threats = []
connected_clients = []
backend_override_until = 0.0
last_spoken_time = 0.0
server_audio_latch = False

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            # Keep alive loop
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

@app.post("/api/alert")
async def receive_alert(payload: AlertPayload):
    data = payload.dict()
    
    # Check manual override
    global server_audio_latch
    is_dismissed = time.time() < backend_override_until
    if is_dismissed:
        data['sos_triggered'] = False
        
    if server_audio_latch:
        data['sos_triggered'] = True
    
    # Native MacOS Hardware Alarm trigger
    global last_spoken_time
    if data['sos_triggered']:
        if time.time() - last_spoken_time > 6.0: # 6.0 second buffer between speaking
            os.system("killall say > /dev/null 2>&1") # Ensure previous speech is dead
            os.system("say 'Critical SOS. Immediate assistance required.' &")
            last_spoken_time = time.time()
            
    # Keep last 50 alerts in history
    active_threats.insert(0, data)
    if len(active_threats) > 50:
        active_threats.pop()
        
    # Broadcast Live Alert to all connected command centers
    for client in connected_clients:
        try:
            await client.send_json(data)
        except Exception:
            pass
            
    return {"status": "success", "force_reset": is_dismissed}

@app.post("/api/dismiss")
async def dismiss_alert():
    global backend_override_until, server_audio_latch
    # Kill any actively speaking Mac phrases
    os.system("killall say > /dev/null 2>&1")
    # Override all AI alerts for the next 10 seconds unconditionally
    backend_override_until = time.time() + 10.0
    server_audio_latch = False
    
    # Force frontend clear
    dismiss_msg = {"command": "force_dismiss"}
    for client in connected_clients:
        try:
            await client.send_json(dismiss_msg)
        except Exception:
            pass
            
    return {"status": "dismissed_successfully"}

@app.post("/api/audio_alert")
async def set_audio_alert(payload: dict):
    global server_audio_latch
    server_audio_latch = payload.get("triggered", False)
    return {"status": "success"}

@app.get("/api/history")
def get_history():
    return active_threats

if __name__ == "__main__":
    import uvicorn
    print("Starting Valora Backend on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)