import React from 'react';
import VoiceBotUI from './components/VoiceBotUI';
import OCR from './components/OCR';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <VoiceBotUI />
      <OCR/>
    </div>
  );
}

export default App;
