import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import EdgeDevice from './pages/EdgeDevice';
import DispatchTerminal from './pages/DispatchTerminal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/edge" element={<EdgeDevice />} />
        <Route path="/police" element={<DispatchTerminal />} />
      </Routes>
    </Router>
  );
}

export default App;
