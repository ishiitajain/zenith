import React, { useState, useEffect, useRef } from 'react';
import './EdgeDevice.css'; // Add scoping styles

function EdgeDevice() {
  const [isConnected, setIsConnected] = useState(false);
  const [cameraFrame, setCameraFrame] = useState('');
  const [visualSos, setVisualSos] = useState(false);
  const [audioSos, setAudioSos] = useState(false);
  const [isAudioInit, setIsAudioInit] = useState(false);
  const [isAlarmingState, setIsAlarmingState] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sirenOscillatorRef = useRef(null);
  const sirenGainRef = useRef(null);
  const sirenIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const voiceSOSLatchRef = useRef(false);
  const isAlarmingRef = useRef(false);

  const isCritical = visualSos || audioSos;

  useEffect(() => {
    document.body.className = 'edge-theme';
    
    // Initialize WebSocket
    wsRef.current = new WebSocket('ws://localhost:8000/ws');
    
    wsRef.current.onopen = () => {
      setIsConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.command === "force_dismiss") {
        voiceSOSLatchRef.current = false;
        setAudioSos(false);
        if (isAlarmingRef.current) {
          stopSiren();
        }
        return;
      }
      
      const newVisualSos = Boolean(data.sos_triggered);
      setVisualSos(newVisualSos);
      setAudioSos(voiceSOSLatchRef.current);
      
      if (data.camera_frame) {
        setCameraFrame(data.camera_frame);
      }
    };
    
    // Grab HTML5 Geolocation and push to API
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        fetch('http://localhost:8000/api/location', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            lat: position.coords.latitude, 
            lng: position.coords.longitude
          })
        }).catch(e => console.error("Loc Sync Error:", e));
      }, (e) => console.log("Geo Denied", e));
    }

    return () => {
      document.body.className = '';
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopSiren();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Sync Audio Siren with critical state
  useEffect(() => {
    if (isCritical) {
      if (isAudioInit && !isAlarmingRef.current) {
        triggerVoiceAlarm();
      }
    } else {
      if (isAlarmingRef.current) {
        stopSiren();
      }
    }
  }, [isCritical, isAudioInit]);

  const initAudio = () => {
    if (isAudioInit) return;
    
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = audioCtx;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
    
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition && !recognitionRef.current) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onaudiostart = () => console.log("Audio capturing started");
        recognition.onsoundstart = () => setLiveTranscript("[🎤 Mic Active - Waiting for Words...]");
        recognition.onspeechstart = () => console.log("Speech detected");
        
        recognition.onresult = async (event) => {
          let currentPhrase = "";
          // CRITICAL BUG FIX: Only read the most recent speech block instead of the entire historical array
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentPhrase += event.results[i][0].transcript.toLowerCase() + " ";
          }
          
          setLiveTranscript(currentPhrase);
          let cleanText = currentPhrase.replace(/[.,!?]/g, '').trim();
          
          // Broaden SOS Triggers to catch ANY variation of panic
          const sosTriggers = ["help", "bachao", "bacha", "save me", "emergency", "danger", "police", "someone", "please"];
          // Extremely strict safe triggers so it NEVER accidentally cancels your alarm!
          const safeTriggers = ["i am safe", "valora dismiss", "valora stop", "false alarm"];
          
          let isPanic = sosTriggers.some(word => cleanText.includes(word));
          let isSafe = safeTriggers.some(word => cleanText.includes(word));
          
          if(isPanic && !isSafe) {
            if(!voiceSOSLatchRef.current) {
              voiceSOSLatchRef.current = true;
              setAudioSos(true);
              fetch('http://localhost:8000/api/audio_alert', { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({triggered: true}) 
              }).catch(e => console.error(e));
            }
          }
          
          if(isSafe) {
            if(voiceSOSLatchRef.current) {
              voiceSOSLatchRef.current = false;
              setAudioSos(false);
              fetch('http://localhost:8000/api/audio_alert', { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({triggered: false}) 
              }).catch(e => console.error(e));
            }
            await fetch('http://localhost:8000/api/dismiss', { method: 'POST' });
            setLiveTranscript("Alarm Cancelled.");
          }
        };
        
        recognition.onerror = (event) => {
            console.error("Speech API Error:", event.error);
            if (event.error !== 'no-speech') {
                setLiveTranscript(`[MIC BLOCKED]: ${event.error}. Check OS Settings.`);
            } else {
                setLiveTranscript("[SILENCE DETECTED]");
            }
        };
        
        recognition.onend = () => {
            if (recognitionRef.current) {
                setTimeout(() => {
                    try { recognition.start(); } catch(e) {}
                }, 1000);
            }
        };
        recognition.start();
      }
    } catch(e) { console.error("Speech API Error:", e); }

    setIsAudioInit(true);
  };

  const triggerVoiceAlarm = () => {
    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    if (!isAlarmingRef.current) {
      isAlarmingRef.current = true;
      setIsAlarmingState(true);
      
      if (!sirenOscillatorRef.current) {
        const sirenOscillator = audioCtx.createOscillator();
        const sirenGain = audioCtx.createGain();
        sirenOscillator.type = 'square';
        sirenOscillator.connect(sirenGain);
        sirenGain.connect(audioCtx.destination);
        sirenGain.gain.value = 1.0; 
        sirenOscillator.start();
        
        sirenOscillatorRef.current = sirenOscillator;
        sirenGainRef.current = sirenGain;
      }

      let high = true;
      sirenIntervalRef.current = setInterval(() => {
        if (sirenOscillatorRef.current && audioCtx) {
          sirenOscillatorRef.current.frequency.setValueAtTime(high ? 1200 : 800, audioCtx.currentTime);
          high = !high;
        }
      }, 250);
    }
  };

  const stopSiren = () => {
    isAlarmingRef.current = false;
    setIsAlarmingState(false);
    
    if (sirenOscillatorRef.current) {
      try { sirenOscillatorRef.current.stop(); } catch(e){}
      sirenOscillatorRef.current.disconnect();
      if (sirenGainRef.current) sirenGainRef.current.disconnect();
      sirenOscillatorRef.current = null;
      sirenGainRef.current = null;
    }
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
  };

  return (
    <>
      <div className="sidebar">
        <div className="brand" id="brand-indicator">Valora Edge</div>
        <p style={{color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.6"}}>
          Strict Focus Architecture.<br/><br/>
          Audio SOS:<br/>Shout "help", "save me", or "bachao"<br/>Cancel: "safe", "stop", or "cancel"<br/><br/>
          Visual SOS:<br/>Hold Fist for 3s<br/>Cancel: Hold Peace Sign for 2s (Same Hand)
        </p>
        
        <div className="controls">
          <button 
            className="btn-audio" 
            onClick={initAudio}
            disabled={isAudioInit}
          >
            {isAudioInit ? "Audio Active" : "1. Enable Safety Audio"}
          </button>
          {!isAudioInit && (
            <p style={{fontSize: "0.8rem", color: "var(--accent-caution)", textAlign: "center"}}>
              Audio is currently blocked by browser.
            </p>
          )}
        </div>
      </div>
      
      <div className="main-content">
        <div className="header">
          <div>
            <h1 style={{margin: "0 0 8px 0", color: "var(--text-main)"}}>Live Monitoring Interface</h1>
            <div style={{color: "var(--text-muted)"}}>Dedicated Biometric Threat Extraction</div>
          </div>
          <div 
             style={{
               padding: "6px 12px", 
               borderRadius: "20px", 
               background: isConnected ? "rgba(140,122,234,0.1)" : "rgba(234,91,108,0.1)", 
               color: isConnected ? "var(--accent-safe)" : "var(--accent-danger)", 
               fontWeight: "600"
             }}
          >
            {isConnected ? "Connected" : "Checking Connection..."}
          </div>
        </div>
        
        <div className="side-by-side" id="presentation-view">
          {cameraFrame ? (
            <img 
              src={cameraFrame} 
              style={{width: "100%", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", objectFit: "cover"}} 
              alt="Live AI Camera Feed" 
            />
          ) : (
            <div style={{
              width: "100%", 
              height: "400px", 
              borderRadius: "20px", 
              background: "rgba(140,122,234,0.05)", 
              display: "flex", 
              flexDirection: "column",
              alignItems: "center", 
              justifyContent: "center", 
              color: "var(--accent-safe)", 
              border: "2px dashed rgba(140,122,234,0.3)",
              fontWeight: "600"
            }}>
              <span style={{fontSize: "2rem", marginBottom: "1rem"}}>📷</span>
              WAITING FOR CAMERA LINK...
            </div>
          )}
          
          <div style={{display: "flex", flexDirection: "column", gap: "2rem"}}>
            <div 
              className="status-box" 
              style={{
                background: isCritical ? 'rgba(234,91,108,0.1)' : 'rgba(140,122,234,0.05)',
                borderColor: isCritical ? 'rgba(234,91,108,0.5)' : 'rgba(140,122,234,0.2)'
              }}
            >
              <h3 style={{color: "var(--text-muted)", margin: "0 0 10px 0", textTransform: "uppercase"}}>
                Global Threat Status
              </h3>
              <h2 style={{color: isCritical ? 'var(--accent-danger)' : 'var(--accent-safe)'}}>
                {isCritical ? "CRITICAL DISPATCH ALARM" : "SECURE"}
              </h2>
            </div>
            
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="label">Visual SOS Lock</span>
                <span className={`value ${visualSos ? 'active' : 'safe'}`}>
                  {visualSos ? "LATCHED" : "Secured"}
                </span>
              </div>
              <div className="metric-card">
                <span className="label">Audio Panic Keyword</span>
                <span className={`value ${audioSos ? 'active' : 'safe'}`}>
                  {audioSos ? "PANIC" : "Listening..."}
                </span>
              </div>
            </div>
            
            <div className="metric-card" style={{marginTop: "5px"}}>
              <span className="label">Live Raw Audio Transcript</span>
              <span style={{fontSize: "1.1rem", fontStyle: "italic", color: "var(--text-main)", marginTop: "10px", minHeight: "30px", wordBreak: "break-word"}}>
                {liveTranscript || "Waiting for voice..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default EdgeDevice;
