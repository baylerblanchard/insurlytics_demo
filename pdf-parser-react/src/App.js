// src/App.js
import React, { useState } from 'react';
import './index.css';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { LoginPage } from './LoginPage';

import { auth } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const API_URL = "http://localhost:9292";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);
  const [status, setStatus] = useState('');
  const [user, loading, error] = useAuthState(auth);

  const handleParseFiles = async (file1, file2) => {
    if (!file1 && !file2) {
      setStatus("Please select at least one file.");
      return;
    }

    setIsLoading(true);
    setStatus("Uploading and parsing... Please wait.");
    setFile1Data(null);
    setFile2Data(null);

    // This is the helper function that now contains the auth logic
    const parseFile = async (file) => {
      
      // 1. Get the current user directly from the auth service
      const currentUser = auth.currentUser; 

      if (!currentUser) { 
        throw new Error('You must be logged in to parse files.');
      }
      
      // 2. Get their ID token and force a refresh
      // By passing 'true', we guarantee we get a
      // fresh, valid token from Google.
      const token = await currentUser.getIdToken(true); 

      const formData = new FormData();
      formData.append('file', file);
      
      // 3. Make the authenticated API call (this part is the same)
      const response = await fetch(`${API_URL}/parse`, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}` 
          },
          body: formData,
      });

      if (!response.ok) {
          const err = await response.json();
          throw new Error(`Error parsing ${file.name}: ${err.error || response.statusText}`);
      }
      return response.json();
    };

    // --- This part remains the same ---
    try {
      const promises = [];
      if (file1) promises.push(parseFile(file1));
      if (file2) promises.push(parseFile(file2));
      
      const results = await Promise.all(promises);

      if (file1) setFile1Data(results.shift());
      if (file2) setFile2Data(results.shift());
      setStatus("Parse complete! Charts updated.");
      
    } catch (error) {
      console.error("Error:", error);
      setStatus(`An error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- This router logic remains the same ---
  if (loading) {
    return (
      <div style={{textAlign: 'center', marginTop: '100px', fontSize: '20px'}}>
        Loading User...
      </div>
    );
  }

  if (error) {
    return <div><p>Error: {error.message}</p></div>;
  }
  
  if (user) {
    return (
      <div className="app-container">
        <Sidebar
          user={user}
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
  
  return <LoginPage />;
}

export default App;