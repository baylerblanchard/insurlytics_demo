// src/Sidebar.js
import React, { useState } from 'react';

// This is a "dumb" component. It just shows UI and reports
// back to its parent (App.js) when things happen.
export function Sidebar({ onParse, isLoading, status, file1Data, file2Data }) {
  // State that *only* lives in the sidebar
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [compareAge, setCompareAge] = useState('');

  const handleParseClick = () => {
    // Call the 'onParse' function that was passed down from App.js
    onParse(file1, file2);
  };
  
  const handleGetDetails = () => {
    // This logic is now part of the Sidebar.
    // We just read the props given to us by App.js
    const age = parseInt(compareAge, 10);
    // ... (logic to build the details table) ...
    // You would set this to a new state variable, e.g., 'setDetailsHTML'
  };

  // The 'disabled' and 'className' are tied directly to the 'isLoading' prop.
  // When the state changes in App.js, this button will *automatically* update.
  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <h1>Policy Analyzer</h1>
      </header>

      <section className="sidebar-section">
        <h2>1. Load Files</h2>
        <div className="file-inputs">
          <div>
            <label htmlFor="pdfFile1">File 1:</label>
            <input 
              type="file" 
              id="pdfFile1" 
              accept="application/pdf"
              onChange={(e) => setFile1(e.target.files[0])}
            />
          </div>
          <div>
            <label htmlFor="pdfFile2">File 2 (Optional):</label>
            <input 
              type="file" 
              id="pdfFile2" 
              accept="application/pdf"
              onChange={(e) => setFile2(e.target.files[0])}
            />
          </div>
          <button 
            id="compareBtn"
            onClick={handleParseClick}
            disabled={isLoading}
            className={isLoading ? 'loading' : ''}
          >
            Parse & Compare
          </button>
          <div id="status">{status}</div>
        </div>
      </section>

      {/* ... (Your Age Comparison and Raw Data sections would go here) ... */}

    </aside>
  );
}