// src/App.js
import React, { useState } from 'react';
import './index.css';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { LoginPage } from './LoginPage'; // Make sure this file exists

// 1. Import hooks
import { auth } from './firebase'; // Make sure this file exists
import { useAuthState } from 'react-firebase-hooks/auth';

// Your API URL
const API_URL = "http://localhost:9292";

function App() {
  // --- This is the new "State Management" ---
  const [isLoading, setIsLoading] = useState(false);
  const [file1Data, setFile1Data] = useState(null);
  const [file2Data, setFile2Data] = useState(null);
  const [status, setStatus] = useState('');

  // 2. This hook watches Firebase and gives you the 'user' object
  const [user, loading, error] = useAuthState(auth);

  // --- This is the main PARSING LOGIC ---
  // It lives in App.js so it can set the app's state
  const handleParseFiles = async (file1, file2) => {
    if (!file1 && !file2) {
      setStatus("Please select at least one file.");
      return;
    }

    setIsLoading(true);
    setStatus("Uploading and parsing... Please wait.");
    setFile1Data(null);
    setFile2Data(null);

    // This is the internal helper function that contains "Step 4"
    const parseFile = async (file) => {
      
      // === THIS IS THE "STEP 4" CODE ===
      if (!user) { // Check if the user object from useAuthState exists
        throw new Error('You must be logged in to parse files.');
      }
      
      // 2. Get their ID token
      const token = await user.getIdToken();

      const formData = new FormData();
      formData.append('file', file);
      
      // 3. Make the authenticated API call
      const response = await fetch(`${API_URL}/parse`, {
          method: 'POST',
          headers: {
              // This is the new, required header
              'Authorization': `Bearer ${token}` 
          },
          body: formData,
      });
      // === END OF "STEP 4" CODE ===

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
      // 4. Turn off loading state
      setIsLoading(false);
    }
  };

  // --- This is the main Router logic ---
  if (loading) {
    return <div>Loading...</div>; // Or a nice spinner component
  }

  if (error) {
    return <div><p>Error: {error.message}</p></div>;
  }
  
  if (user) {
    // --- User is LOGGED IN ---
    // Show the main app and pass down the state and functions
    return (
      <div className="app-container">
        <Sidebar
          // Pass the function down to the sidebar
          onParse={handleParseFiles} 
          // Pass down state
          isLoading={isLoading}
          status={status}
          file1Data={file1Data}
          file2Data={file2Data}
          // Pass the user object so Sidebar can show email, etc.
          user={user} 
        />
        <MainContent
          file1Data={file1Data}
          file2Data={file2Data}
        />
      </div>
    );
  } 
  
  // --- User is LOGGED OUT ---
  return <LoginPage />;
}

export default App;