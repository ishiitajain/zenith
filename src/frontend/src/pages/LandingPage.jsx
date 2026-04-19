import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.className = 'landing-body-override';
    return () => {
      document.body.className = '';
    };
  }, []);

  return (
    <div className="landing-layout">
      {/* Dynamic Background Mesh */}
      <div className="mesh-gradient mesh-1"></div>
      <div className="mesh-gradient mesh-2"></div>

      {/* Navigation */}
      <nav className="landing-navbar">
        <div className="landing-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          Valora.
        </div>
        <div className="nav-links">
          <a href="#mission" className="nav-item">Mission</a>
          <a href="#cctv" className="nav-item">The Flaw</a>
          <a href="#hotspots" className="nav-item">Radar</a>
          <button onClick={() => navigate('/edge')} className="launch-btn-nav">
            Start Live Node
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-content fade-in-up">
          <div className="hero-pill-glow">
            <span className="pill-dot"></span> Next-Gen Active Surveillance
          </div>
          <h1 className="hero-title">
            Stop Crimes Before <br/>
            They Become <span className="text-gradient">Evidence.</span>
          </h1>
          <p className="hero-subtitle">
            Valora turns any webcam into a zero-latency biometric shield. Using deep voice 
            and gesture arrays to bypass the bystander effect and instantly connect isolated zones 
            directly to police dispatch networks.
          </p>
          <div className="hero-actions">
            <button onClick={() => navigate('/edge')} className="btn-primary">
              Launch Edge Tracker
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: '8px'}}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
            <button onClick={() => navigate('/police')} className="btn-secondary">
              View Dispatch Hub
            </button>
          </div>
        </div>
      </section>

      {/* Data Ribbon */}
      <div className="data-ribbon border-top border-bottom fade-in-up delay-1">
        <div className="ribbon-item">
          <span className="ribbon-value">0%</span>
          <span className="ribbon-label">Cloud Uploads</span>
        </div>
        <div className="ribbon-divider"></div>
        <div className="ribbon-item">
          <span className="ribbon-value">&lt; 1s</span>
          <span className="ribbon-label">Dispatch Latency</span>
        </div>
        <div className="ribbon-divider"></div>
        <div className="ribbon-item">
          <span className="ribbon-value">Edge</span>
          <span className="ribbon-label">Architecture</span>
        </div>
      </div>

      {/* CCTV vs Valora */}
      <section id="cctv" className="comparison-section">
        <div className="section-header fade-in-up">
          <h2 className="section-title">The Surveillance Illusion</h2>
          <p className="section-desc">
            Governments map secluded areas with heavy CCTV presence. But cameras are 
            historians, not guardians. They watch silently.
          </p>
        </div>

        <div className="cards-container">
          <div className="feature-card reactionary fade-in-up delay-1">
            <div className="card-icon-wrapper red">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
            </div>
            <h3 className="card-title">CCTVs Are Reactive</h3>
            <p className="card-desc">
              A traditional security camera only gathers evidence for a later investigation. 
              By the time footage is retrieved from a DVR and analyzed, the damage is already permanent.
            </p>
          </div>

          <div className="feature-card proactive fade-in-up delay-2">
            <div className="card-icon-wrapper blue">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h3 className="card-title">Valora Is Proactive</h3>
            <p className="card-desc">
              Valora actively intercepts biometric panic markers locally and immediately seizes control. 
              It blasts a siren deterrent while creating a stealth unkillable tunnel to authorities.
            </p>
          </div>
        </div>
      </section>

      {/* National Heatmap Analytics */}
      <section id="hotspots" className="hotspot-section">
        <div className="hotspot-container fade-in-up">
          <div className="hotspot-text">
            <h2>National Vulnerability Index</h2>
            <p className="section-desc-light">
              Statistical data reveals massive geographic blind spots in conventional security infrastructure.
            </p>
            <p className="hotspot-detailed">
              Based on recent National Crime Records Bureau (NCRB) reports, over 86% of isolation-based incidents occur in unmonitored transit corridors and Tier-2 urban outskirts. Valora bypasses the need for local CCTV saturation by mapping historical crime density globally.
            </p>
            
            <div className="stats-grid">
               <div className="stat-box">
                  <span className="stat-number">4.2M+</span>
                  <span className="stat-label">Reported Incidents</span>
               </div>
               <div className="stat-box">
                  <span className="stat-number">68%</span>
                  <span className="stat-label">In Secluded Zones</span>
               </div>
            </div>
          </div>
          
          <div className="national-heatmap-visual">
             <img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/India_State_Boundary_Map.svg" alt="India Heatmap" className="india-svg" />
             <div className="glowing-dot heatmap-delhi"></div>
             <div className="glowing-dot heatmap-mumbai"></div>
             <div className="glowing-dot heatmap-bengaluru"></div>
             <div className="glowing-dot heatmap-lucknow"></div>
             <div className="glowing-dot heatmap-kolkata"></div>
             
             <div className="hotspot-card glass">
               <span style={{color: '#f87171', fontWeight: '700', fontSize: '0.8rem', letterSpacing: '1px'}}>⚠ STATISTICAL HOTSPOTS</span><br/>
               <span style={{color: '#fff', fontSize: '1rem', fontWeight: '500'}}>High-Density Threat Zones</span><br/>
               <span style={{color: '#94a3b8'}}>Historical Data Mapping</span>
             </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer id="mission" className="footer-cta text-center">
        <div className="fade-in-up">
            <h2 className="cta-heading">Our Mission: Eliminate the Bystander Effect.</h2>
            <p className="cta-subtext" style={{maxWidth: '800px', margin: '0 auto 2.5rem', lineHeight: '1.6'}}>
              Valora was engineered to protect vulnerable individuals in isolated environments. 
              By cutting out human hesitation and bridging the gap directly between biometric distress 
              and immediate police dispatch, we ensure no cry for help ever goes unheard.
            </p>
            <button onClick={() => navigate('/edge')} className="btn-primary shadow-glow hidden-overflow">
            Initialize Tracking
            </button>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
