// src/App.js
import React, { useState, useMemo } from 'react';
import './index.css'; // We'll put all your styles here
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';

// Your API URL (now a constant)
const API_URL = "http://localhost:9292";

function App() {
  // --- This is the new "State Management" ---
  // Instead of global variables, we use React's 'useState' hook.
  // When you call 'setIsLoading(true)', React automatically re-renders
  // any component that depends on 'isLoading'. This is what fixes the
  // "clunky" feel.
  const [isLoading, setIsLoading] = useState(false);
  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);
  const [status, setStatus] = useState('');

  // --- Data-Parsing Logic ---
  const handleParseFiles = async (file1, file2) => {
    if (!file1 && !file2) {
      setStatus("Please select at least one file.");
      return;
    }

    // 1. Set the loading state
    setIsLoading(true);
    setStatus("Uploading and parsing... Please wait.");
    setFile1Data(null);
    setFile2Data(null);

    const parseFile = async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_URL}/parse`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Error parsing ${file.name}: ${err.error || response.statusText}`);
      }
      return response.json();
    };

    // 2. Try to parse files
    try {
      const promises = [];
      if (file1) promises.push(parseFile(file1));
      if (file2) promises.push(parseFile(file2));
      
      const results = await Promise.all(promises);

      // 3. Set the data state
      if (file1) setFile1Data(results.shift());
      if (file2) setFile2Data(results.shift());
      setStatus("Parse complete! Charts updated.");
      
    } catch (error) {
      console.error("Error:", error);
      setStatus(`An error occurred: ${error.message}`);
    } finally {
      // 4. Turn off loading state (no matter what)
      setIsLoading(false);
    }
  };

  // --- Render the UI ---
  // This is "declarative." We are *describing* the UI based on
  // the current state.
  return (
    <div className="app-container">
      <Sidebar
        onParse={handleParseFiles}
        isLoading={isLoading}
        status={status}
        file1Data={file1Data}
        file2Data={file2Data}
      />
      <MainContent
        file1Data={file1Data}
        file2Data={file2Data}
      />
    </div>
  );
}

export default App;