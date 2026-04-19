# Valora: The SOS Shield Network
> *Precision Distress Signalling for Emergency Dispatch.*

Valora is a specialized safety system designed to eliminate the lag between a distress signal and police response. By stripping away noisy behavioral AI, Valora focuses on 100% accurate, biometric-locked distress triggers—both visual and auditory—connecting victims directly to a high-intensity Police Dispatch interface.

---

## 🚀 Core SOS Features
- **Biometric Hand-Locked SOS:** Uses Google MediaPipe to track high-accuracy hand triggers. Hold a **Closed Fist** for 3 seconds to latch an alarm. To prevent attacker interference, the system locks to the specific hand (Left/Right) that triggered the SOS; only *that exact hand* can dismiss the alarm using a **Peace Sign** (Victory gesture).
- **Audio Panic Latching:** Natively monitors for critical distress keywords ("Help", "Bachao", "Save Me", "Emergency", "Danger"). A high-intensity audio pulse is triggered the moment a keyword is detected. Advanced punctuation stripping ensures reliable voice triggering.
- **Police Dispatch Terminal:** A dedicated interface for law enforcement that triggers a full-screen red strobe override and plays a loud siren when an emergency is latched.
- **Remote SOS Dismissal:** Police can remotely verify and dismiss false alarms from their dispatch terminal, instantly resetting the victim's dashboard via WebSockets.
- **Privacy-First Processing:** All AI computer vision and audio recognition happens locally on the edge device. No video is ever sent to a cloud server—only the alarm state and a live feed for dispatch.

---

## 🛠 Tech Stack
- **Vision Engine:** Google MediaPipe (Gesture & Handedness Tracking) running in high-performance `VIDEO_MODE`.
- **Speech Engine:** Zero-Latency WebKit Speech Recognition API.
- **Backend:** Python + FastAPI + WebSockets for real-time dispatch synchronization.
- **Frontend:** React + Vite + React Router for a robust, hot-reloading user interface.

---

## 🖥 Installation & Startup

**1. Clone the Repository:**
```bash
git clone <your-repo-link>
cd HOF-Zenith
```

**2. Start the Dispatch Backend:**
```bash
cd src/backend
# (Optional) python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python server.py
```

**3. Launch the ML Vision Engine:**
In a new terminal:
```bash
cd src/ml
# (Optional) python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python download_models.py  # Required to fetch SOTA vision models
python ml_engine.py
```

**4. Start the React Frontend:**
In a new terminal:
```bash
cd src/frontend
npm install
npm run dev
```

Navigate to:
- **Victim Dashboard:** `http://localhost:5173/` (Click "Enable Safety Audio" to start)
- **Police Station:** `http://localhost:5173/police` (Click "Initialize Secure Audio Link" to start)

---

## ⚙️ Engineering Merit
Valora implements a **Spatial-Temporal Hand-Locking algorithm**. By identifying the specific handedness of an SOS trigger, the system prevents unauthorized alarm cancellations by background actors (attackers), ensuring only the victim retains control over the distress signal logic.