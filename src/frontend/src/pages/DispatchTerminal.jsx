import React, { useState, useEffect, useRef } from 'react';
import './DispatchTerminal.css'; // Add scoping styles

function DispatchTerminal() {
  const [isAudioInit, setIsAudioInit] = useState(false);
  const [isAlarming, setIsAlarming] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [cameraFrame, setCameraFrame] = useState('');
  const [evidenceLogs, setEvidenceLogs] = useState([]);
  
  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sirenOscillatorRef = useRef(null);
  const sirenGainRef = useRef(null);
  const sirenIntervalRef = useRef(null);

  useEffect(() => {
    document.body.className = sosTriggered ? 'police-theme red-flash' : 'police-theme';
  }, [sosTriggered]);

  useEffect(() => {
    document.body.className = 'police-theme';

    wsRef.current = new WebSocket('ws://localhost:8000/ws');

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.command === "evidence_logged") {
        setEvidenceLogs(prev => [data, ...prev]);
        return;
      }
      
      if (data.camera_frame) {
        setCameraFrame(data.camera_frame);
      }
      
      if (data.sos_triggered) {
        setSosTriggered(true);
      } else {
        setSosTriggered(false);
      }
    };

    return () => {
      document.body.className = '';
      if (wsRef.current) wsRef.current.close();
      stopSiren();
    };
  }, []);

  useEffect(() => {
    if (sosTriggered) {
      playSiren();
    } else {
      stopSiren();
    }
  }, [sosTriggered]);

  const initPoliceAudio = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = audioCtx;
    setIsAudioInit(true);
    
    const dummy = audioCtx.createOscillator();
    dummy.connect(audioCtx.destination);
    dummy.start(); 
    dummy.stop(audioCtx.currentTime + 0.01);
  };

  const playSiren = () => {
    if (!isAudioInit) return;
    setIsAlarming(true);
    
    const audioCtx = audioCtxRef.current;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    if (!sirenOscillatorRef.current) {
        const sirenOscillator = audioCtx.createOscillator();
        const sirenGain = audioCtx.createGain();
        sirenOscillator.type = 'sawtooth';
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
            sirenOscillatorRef.current.frequency.setValueAtTime(high ? 900 : 700, audioCtx.currentTime);
            high = !high;
        }
    }, 300);
  };

  const stopSiren = () => {
    setIsAlarming(false);
    if (sirenOscillatorRef.current) {
        try { sirenOscillatorRef.current.stop(); } catch(e){}
        sirenOscillatorRef.current.disconnect();
        if (sirenGainRef.current) sirenGainRef.current.disconnect();
        sirenOscillatorRef.current = null;
    }
    if (sirenIntervalRef.current) {
        clearInterval(sirenIntervalRef.current);
        sirenIntervalRef.current = null;
    }
  };

  const dismissOverride = async () => {
    try {
      await fetch('http://localhost:8000/api/dismiss', { method: 'POST' });
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="dispatch-header">
        <h1 
            style={{
                color: sosTriggered ? "white" : "#555", 
                fontSize: "3rem", 
                letterSpacing: "5px"
            }}
        >
            {sosTriggered ? "!!! CRITICAL LATCH !!!" : "DISPATCH IDLE"}
        </h1>
        <button 
            className="dispatch-btn"
            onClick={initPoliceAudio} 
            disabled={isAudioInit}
            style={{
                padding: "10px 20px", 
                fontSize: "1rem", 
                border: "none", 
                background: isAudioInit ? "#28a745" : "#007bff", 
                color: "white", 
                cursor: "pointer", 
                borderRadius: "5px", 
                marginTop: "10px"
            }}
        >
            {isAudioInit ? "AUDIO COMMS ARMED" : "INITIALIZE SECURE AUDIO LINK"}
        </button>
      </div>
      
      <div className="dispatch-container">
        <div className="alert-plate">
          <h2 style={{color: sosTriggered ? "white" : "#555", fontSize: "2.5rem", margin: 0}}>
            {sosTriggered ? "IMMEDIATE RESPONSE REQUIRED" : "NO ALARM"}
          </h2>
          {sosTriggered && (
            <p style={{color: "#fff", fontSize: "1.5rem", lineHeight: "1.6"}}>
              <br/><b style={{color: "yellow"}}>!!! LOCATION INCIDENT VERIFIED !!!</b><br/>
              Region Alpha — [26.8467, 80.9462]<br/>Lucknow Sector A
            </p>
          )}
          {sosTriggered && (
            <button 
                className="dispatch-btn" 
                onClick={dismissOverride}
            >
                DISMISS FAKE ALARM REMOTE
            </button>
          )}
        </div>
        <div className="feed-plate">
          {!cameraFrame && <h3 style={{color: "#555"}}>[NO SIGNAL]</h3>}
          {cameraFrame && (
            <img 
                src={cameraFrame} 
                alt="Dispatch Cam" 
                style={{opacity: sosTriggered ? 1 : 0.2, display: "block"}} 
            />
          )}
        </div>
      </div>
      
      <div className="archive-container">
        <h2 style={{color: "#888", fontSize: "1.5rem", borderBottom: "1px solid #333", paddingBottom: "10px", marginTop: 0}}>
            SECURE EVIDENCE ARCHIVE
        </h2>
        {evidenceLogs.map((log, index) => (
            <div key={index} className="evidence-card">
                <h4 style={{margin: 0, color: "#ffcc00"}}>
                    INCIDENT BURST LOG — {new Date(log.timestamp * 1000).toLocaleTimeString()}
                </h4>
                <div className="evidence-gallery">
                    {log.images.map((imgUrl, i) => (
                        <img key={i} src={"http://localhost:8000" + imgUrl} alt="Evidence" />
                    ))}
                </div>
            </div>
        ))}
      </div>
    </>
  );
}

export default DispatchTerminal;
