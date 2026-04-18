import cv2
import time
import base64
import requests
from sos_vision import SOSVisionTracker

API_URL = "http://localhost:8000/api/alert"

class ValoraMasterEngine:
    def __init__(self):
        print("\n==================================")
        print("Starting Valora System (HYPER-MODULAR MODE)")
        print("- YOLO/DeepFace: OVERRIDDEN")
        print("- Deep Profiling: OVERRIDDEN")
        print("- Native Gestures: ARMED")
        print("==================================\n")
        
        # Deploy the strict Hand-Locking Modular CNN
        self.vision = SOSVisionTracker(model_asset_path='gesture_recognizer.task')
        self.running = True

    def run(self):
        cap = cv2.VideoCapture(0)
        
        while self.running:
            ret, frame = cap.read()
            if not ret:
                continue
                
            frame = cv2.flip(frame, 1) # Mirror for UI comfort
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # 1. Pipeline execution pushed entirely to hyper-focused module
            sos_triggered, debug_str = self.vision.process_frame(frame_rgb, frame)
            
            # Status overlays
            cv2.putText(frame, debug_str, (30, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.imshow("Valora Edge Camera (Raw Core)", frame)
            
            # 2. Package Clean Backend Payload (Massively stripped for purely SOS handling)
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
            b64_frame = base64.b64encode(buffer).decode('utf-8')
            
            payload = {
                "sos_triggered": bool(sos_triggered),
                "timestamp": time.time(),
                "camera_frame": f"data:image/jpeg;base64,{b64_frame}"
            }
            
            try:
                requests.post(API_URL, json=payload, timeout=0.1)
            except requests.exceptions.RequestException:
                pass
                
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    engine = ValoraMasterEngine()
    try:
        engine.run()
    except KeyboardInterrupt:
        print("\nShutdown.")
