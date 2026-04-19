import os
import json
import time
import base64
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Valora Backend Server")

os.makedirs("evidence", exist_ok=True)
app.mount("/evidence", StaticFiles(directory="evidence"), name="evidence")

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
global_last_sos_state = False
current_lat, current_lng = 26.8467, 80.9462

class LocationPayload(BaseModel):
    lat: float
    lng: float

@app.post("/api/location")
async def update_location(payload: LocationPayload):
    global current_lat, current_lng
    current_lat, current_lng = payload.lat, payload.lng
    return {"status": "success"}

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
        
    # Check if a NEW SOS just triggered
    global global_last_sos_state
    if data['sos_triggered'] and not global_last_sos_state:
        # BURST CAPTURE: grab 4 recent frames from rolling buffer
        ts_id = int(time.time())
        saved_urls = []
        for i in range(0, min(20, len(active_threats)), 5):
            try:
                frame_b64 = active_threats[i]['camera_frame'].replace("data:image/jpeg;base64,", "")
                img_data = base64.b64decode(frame_b64)
                fname = f"incident_{ts_id}_f{i}.jpg"
                fpath = os.path.join("evidence", fname)
                with open(fpath, "wb") as f:
                    f.write(img_data)
                saved_urls.append(f"/evidence/{fname}")
            except Exception:
                pass
        
        # Dispatch Evidence Notification to Police
        if saved_urls:
            evidence_msg = {
                "command": "evidence_logged",
                "timestamp": ts_id,
                "images": saved_urls,
                "location": {"lat": current_lat, "lng": current_lng}
            }
            for client in connected_clients:
                try:
                    await client.send_json(evidence_msg)
                except Exception:
                    pass

    global_last_sos_state = data['sos_triggered']
    
    data['location'] = {'lat': current_lat, 'lng': current_lng}
    
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
    # Hackathon Fix: Lower cooldown from 10.0s to 1.0s so you can rapidly demo it!
    backend_override_until = time.time() + 1.0
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