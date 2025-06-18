import React, { useState } from 'react';
import { analyzeDocument } from '../services/geminiService';

const extractTextFromPDF = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        // Import pdf-parse dynamically
        const pdfjsLib = await import('pdfjs-dist/webpack');
        
        const typedarray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        
        let textContent = '';
        
        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          textContent += pageText + '\n';
        }
        
        resolve(textContent);
      } catch (error) {
        console.error('PDF parsing error:', error);
        reject(new Error('Failed to extract text from PDF: ' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

function FileUpload() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Extracting text from PDF...');
      // Extract text from PDF
      const documentText = await extractTextFromPDF(file);
      console.log('Extracted text length:', documentText.length);
      console.log('First 500 chars:', documentText.substring(0, 500));
      
      if (!documentText || documentText.trim().length < 100) {
        throw new Error('PDF appears to be empty or contains mostly images. Please try a text-based PDF.');
      }
      
      console.log('Sending to Gemini for analysis...');
      // Analyze with Gemini
      const result = await analyzeDocument(documentText);
      
      if (result.success) {
        setAnalysis(result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze document: ' + err.message);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>T&C Document Analyzer</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="file" 
          accept=".pdf"
          onChange={handleFileChange}
          style={{ marginBottom: '10px' }}
        />
        {file && <p>Selected: {file.name}</p>}
      </div>

      <button 
        onClick={handleUpload} 
        disabled={!file || loading}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#6c757d' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: file && !loading ? 'pointer' : 'not-allowed'
        }}
      >
        {loading ? 'Analyzing...' : 'Analyze Document'}
      </button>

      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24',
          borderRadius: '4px' 
        }}>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {analysis && analysis.success && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          borderRadius: '4px' 
        }}>
          <h3>Analysis Results:</h3>
          <div style={{ marginBottom: '15px' }}>
            <strong>Total Issues Found: {analysis.issueCount.total}</strong>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h4>Issues by Category:</h4>
            <ul>
              <li>Privacy: {analysis.issueCount.privacy}</li>
              <li>Data Usage: {analysis.issueCount.data}</li>
              <li>User Rights: {analysis.issueCount.rights}</li>
              <li>Liability: {analysis.issueCount.liability}</li>
              <li>Termination: {analysis.issueCount.termination}</li>
            </ul>
          </div>
          
          <div>
            <h4>Detailed Analysis:</h4>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              backgroundColor: '#f8f9fa', 
              padding: '10px',
              borderRadius: '4px'
            }}>
              {analysis.analysis}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;