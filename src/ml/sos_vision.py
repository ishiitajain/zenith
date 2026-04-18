import time
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

class SOSVisionTracker:
    def __init__(self, model_asset_path='gesture_recognizer.task'):
        self.recognizer = None
        try:
            base_options = python.BaseOptions(model_asset_path=model_asset_path)
            # Enforce num_hands=1 so it ONLY tracks the primary hand, automatically rejecting secondary background threats
            options = vision.GestureRecognizerOptions(
                base_options=base_options, 
                running_mode=vision.RunningMode.VIDEO,
                num_hands=1,
                min_hand_detection_confidence=0.4,
                min_hand_presence_confidence=0.4,
                min_tracking_confidence=0.4
            )
            self.recognizer = vision.GestureRecognizer.create_from_options(options)
            print("Modular SOS Vision Engine Loaded (Strict Handedness Tracking)")
        except Exception as e:
            print(f"Vision Init Failed: {e}")

        # Core Runtime State
        self.last_stable_gesture = None
        self.gesture_start_time = 0.0
        self.active_handedness = None  # Tracks 'Left' or 'Right' currently visible
        
        self.sos_latched = False
        self.locked_handedness = None  # The exact chronological physical hand that triggered the threat

    def process_frame(self, frame_rgb, frame_bgr):
        if not self.recognizer:
            return False, "Engine Offline"
            
        current_time = time.time()
        try:
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
            result = self.recognizer.recognize_for_video(mp_image, int(current_time * 1000))
        except Exception as e:
            return self.sos_latched, f"MP Error: {e}"
            
        gesture_detected = None
        handedness_detected = None
        
        if hasattr(result, 'hand_landmarks') and result.hand_landmarks:
            for hand_landmarks in result.hand_landmarks:
                h, w, _ = frame_bgr.shape
                for lm in hand_landmarks:
                    cx, cy = int(lm.x * w), int(lm.y * h)
                    cv2.circle(frame_bgr, (cx, cy), 5, (255, 0, 255), cv2.FILLED)
                    
            if hasattr(result, 'gestures') and result.gestures and len(result.gestures) > 0:
                top_gesture = result.gestures[0][0].category_name
                gesture_score = result.gestures[0][0].score
                
                # Biometric Hand Tracking extraction
                if hasattr(result, 'handedness') and result.handedness and len(result.handedness) > 0:
                    handedness_detected = result.handedness[0][0].category_name
                
                # Trigger bounds
                if gesture_score > 0.45:
                    if top_gesture == "Closed_Fist":
                        gesture_detected = "SOS"
                    elif top_gesture == "Victory":
                        gesture_detected = "CANCEL"

        # Stability Block: Resets perfectly if NO constraints match (even if it flashes 'None' naturally!)
        if gesture_detected != self.last_stable_gesture or handedness_detected != self.active_handedness:
            self.last_stable_gesture = gesture_detected
            self.active_handedness = handedness_detected
            self.gesture_start_time = current_time

        held_time = current_time - self.gesture_start_time if self.last_stable_gesture else 0.0
        debug_str = "No Secure Hands"
        
        # Action Evaluation
        if self.last_stable_gesture == "SOS":
            if not self.sos_latched:
                debug_str = f"LATCHING SOS ({self.active_handedness}): {held_time:.1f}s / 3.0s"
                cv2.putText(frame_bgr, debug_str, (30, 200), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 165, 255), 3)
                if held_time >= 3.0:  # Rigid 3 Second constraint per user
                    self.sos_latched = True
                    self.locked_handedness = self.active_handedness # Absolute physical memory lock!
            else:
                debug_str = f"CRITICAL LATCHED [{self.locked_handedness}]"
                
        elif self.last_stable_gesture == "CANCEL":
            if self.sos_latched:
                # MANDATORY VALIDATION: You cannot use a mismatched hand to override the threat matrix!
                if self.active_handedness == self.locked_handedness:
                    debug_str = f"CANCELING ALARM ({self.active_handedness}): {held_time:.1f}s / 2.0s"
                    cv2.putText(frame_bgr, debug_str, (30, 200), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 3)
                    if held_time >= 2.0:
                        self.sos_latched = False
                        self.locked_handedness = None
                else:
                    debug_str = f"SECURITY BREACH: {self.active_handedness} Hand cannot override {self.locked_handedness} Alert!"
                    cv2.putText(frame_bgr, debug_str, (30, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            else:
                 debug_str = f"PEACE SIGN DETECTED ({self.active_handedness})"
                 
        if self.sos_latched:
             cv2.putText(frame_bgr, f"HACK LATCH SECURE -> [{self.locked_handedness} Hand Only]", (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 3)
             
        return self.sos_latched, debug_str
