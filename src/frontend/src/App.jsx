import { BrowserRouter, Routes, Route } from 'react-router-dom';
import EdgeDevice from './pages/EdgeDevice';
import DispatchTerminal from './pages/DispatchTerminal';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EdgeDevice />} />
        <Route path="/police" element={<DispatchTerminal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
