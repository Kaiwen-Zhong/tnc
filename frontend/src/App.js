import React from 'react';
import FileUpload from './components/FileUpload';
import './App.css';

function App() {
  console.log('Gemini API Key:', process.env.REACT_APP_GEMINI_API_KEY);
  
  return (
    <div className="App">
      <FileUpload />
    </div>
  );
}

export default App;