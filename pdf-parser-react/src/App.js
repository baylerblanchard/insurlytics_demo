import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { LoginPage } from './LoginPage';

import { auth } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from "firebase/auth";

// Your API URL
const API_URL = "http://localhost:9292";

// Auto-logout timer (e.g., 15 minutes = 15 * 60 * 1000)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

function App() {
  // --- State Management ---
  const [isLoading, setIsLoading] = useState(false);
  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);
  const [status, setStatus] = useState('');
  const [user, loading, error] = useAuthState(auth);

  // --- AUTO-LOGOUT LOGIC ---
  const handleLogout = useCallback(() => {
      signOut(auth).then(() => {
        window.location.reload();
      });
  }, []);

  useEffect(() => {
    if (!user) return;

    let timeoutId;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [user, handleLogout]);

  // --- DATA PARSING LOGIC (Restored) ---
  const handleParseFiles = async (file1, file2) => {
    if (!file1 && !file2) {
      setStatus("Please select at least one file.");
      return;
    }

    setIsLoading(true);
    setStatus("Uploading and parsing... Please wait.");
    setFile1Data(null);
    setFile2Data(null);

    const parseFile = async (file) => {
      if (!user) { 
        throw new Error('You must be logged in to parse files.');
      }
      
      // Force a token refresh to ensure it's valid
      const token = await user.getIdToken(true);

      const formData = new FormData();
      formData.append('file', file);
      
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

  // --- MAIN ROUTER LOGIC ---
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