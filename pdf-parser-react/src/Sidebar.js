import React, { useState } from 'react';
// Import Auth and SignOut
import { auth } from './firebase';
import { signOut } from "firebase/auth";
// Import Syntax Highlighter
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

// --- Helper Functions for "Get Details" Table ---
const findDataByAge = (age, data) => data.yearly_data.find(item => item.age === age);

const getAnnualData = (curr, prev) => {
    if (!curr) return { premium: null, growth: null, netGain: null };
    const prevPremium = prev ? prev.cumulative_premium : 0;
    const prevGrowth = prev ? prev.net_cash_value : 0;
    
    return {
        premium: curr.cumulative_premium - prevPremium,
        growth: curr.net_cash_value - prevGrowth,
        netGain: curr.net_cash_value - curr.cumulative_premium
    };
};

const format = (val) => val === null || val === undefined ? 'N/A' : `$${val.toLocaleString()}`;
// --- End of Helpers ---


export function Sidebar({ 
  user, 
  onParse, 
  isLoading, 
  status, 
  file1Data, 
  file2Data 
}) {
  
  // --- Local State ---
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [compareAge, setCompareAge] = useState('');
  const [detailsHTML, setDetailsHTML] = useState('');
  const [copyStatus, setCopyStatus] = useState(''); // 'file1' or 'file2'

  // --- Event Handlers ---
  const handleParseClick = () => {
    onParse(file1, file2);
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  const handleCopy = (fileKey) => {
    const dataToCopy = (fileKey === 'file1') ? file1Data : file2Data;
    if (!dataToCopy) return;

    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2))
      .then(() => {
        setCopyStatus(fileKey);
        setTimeout(() => setCopyStatus(''), 2000);
      })
      .catch(err => console.error('Failed to copy text: ', err));
  };
  
  const handleGetDetails = () => {
    const age = parseInt(compareAge, 10);
    if (!age) {
        setDetailsHTML("<p style='color: red;'>Please enter a valid age.</p>");
        return;
    }
    if (!file1Data) {
        setDetailsHTML("<p style='color: red;'>Please parse at least one file first.</p>");
        return;
    }

    const data1_curr = findDataByAge(age, file1Data);
    const data1_prev = findDataByAge(age - 1, file1Data);
    const data2_curr = file2Data ? findDataByAge(age, file2Data) : null;
    const data2_prev = file2Data ? findDataByAge(age - 1, file2Data) : null;
    
    const annual1 = getAnnualData(data1_curr, data1_prev);
    const annual2 = getAnnualData(data2_curr, data2_prev);

    const table = `
        <table>
            <thead> <tr> <th>Metric</th> <th>File 1</th> <th>File 2</th> </tr> </thead>
            <tbody>
                <tr> <td>Cumulative Premium</td> <td>${format(data1_curr?.cumulative_premium)}</td> <td>${format(data2_curr?.cumulative_premium)}</td> </tr>
                <tr> <td>Net Cash Value</td> <td>${format(data1_curr?.net_cash_value)}</td> <td>${format(data2_curr?.net_cash_value)}</td> </tr>
                <tr> <td>Net Death Benefit</td> <td>${format(data1_curr?.net_death_benefit)}</td> <td>${format(data2_curr?.net_death_benefit)}</td> </tr>
                <tr> <td><strong>Net Gain / Loss</strong></td> <td><strong>${format(annual1.netGain)}</strong></td> <td><strong>${format(annual2.netGain)}</strong></td> </tr>
                <tr style="background-color: #f7f7f7;"> <td><strong>Annual Premium</strong></td> <td><strong>${format(annual1.premium)}</strong></td> <td><strong>${format(annual2.premium)}</strong></td> </tr>
                <tr style="background-color: #f7f7f7;"> <td><strong>Annual Growth</strong></td> <td><strong>${format(annual1.growth)}</strong></td> <td><strong>${format(annual2.growth)}</strong></td> </tr>
            </tbody>
        </table>
    `;
    setDetailsHTML(table);
  };

  const isAgeCompareEnabled = file1Data ? 'enabled' : '';

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <h1>Policy Analyzer</h1>
        {user && (
          <div className="user-info">
            <p>{user.email}</p>
            <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
          </div>
        )}
      </header>

      {/* --- File Uploader --- */}
      <section className="sidebar-section">
        <h2>1. Load Files</h2>
        <div className="file-inputs">
          <div>
            <label htmlFor="pdfFile1">File 1:</label>
            <input 
              type="file" id="pdfFile1" accept="application/pdf"
              onChange={(e) => setFile1(e.target.files[0])}
            />
          </div>
          <div>
            <label htmlFor="pdfFile2">File 2 (Optional):</label>
            <input 
              type="file" id="pdfFile2" accept="application/pdf"
              onChange={(e) => setFile2(e.target.files[0])}
            />
          </div>
          <button 
            id="compareBtn"
            onClick={handleParseClick}
            disabled={isLoading}
            className={isLoading ? 'loading' : ''}
          >
            {isLoading ? 'Parsing...' : 'Parse & Compare'}
          </button>
          <div id="status">{status}</div>
        </div>
      </section>

      {/* --- Age Comparator --- */}
      <section className="sidebar-section">
        <h2>2. Compare Age</h2>
        <div className={`age-comparison ${isAgeCompareEnabled}`}>
          <p>Enter an age to see a detailed comparison.</p>
          <input 
            type="number" id="compareAge" placeholder="Enter Age"
            value={compareAge}
            onChange={(e) => setCompareAge(e.target.value)}
          />
          <button id="compareAgeBtn" onClick={handleGetDetails}>Get Details</button>
          <div 
            id="comparisonDetails" 
            dangerouslySetInnerHTML={{ __html: detailsHTML }} 
          />
        </div>
      </section>

      {/* --- Raw Data Accordion --- */}
      <section className="sidebar-section">
        <h2>3. Raw Data</h2>
        <details className="details-accordion">
            <summary>Show/Hide Raw JSON</summary>
            <div className="raw-data-container">
                
                {file1Data && (
                  <div className="raw-data-box">
                      <div className="raw-data-header">
                        <h3>File 1</h3>
                        <button 
                          className="copy-btn" 
                          onClick={() => handleCopy('file1')}
                        >
                          {copyStatus === 'file1' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <SyntaxHighlighter 
                        language="json" 
                        style={atomOneDark}
                        customStyle={{ padding: '15px', borderRadius: '8px', fontSize: '13px' }}
                        wrapLines={true}
                      >
                        {JSON.stringify(file1Data, null, 2)}
                      </SyntaxHighlighter>
                  </div>
                )}

                {file2Data && (
                  <div className="raw-data-box">
                      <div className="raw-data-header">
                        <h3>File 2</h3>
                        <button 
                          className="copy-btn" 
                          onClick={() => handleCopy('file2')}
                        >
                          {copyStatus === 'file2' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <SyntaxHighlighter 
                        language="json" 
                        style={atomOneDark}
                        customStyle={{ padding: '15px', borderRadius: '8px', fontSize: '13px' }}
                        wrapLines={true}
                      >
                        {JSON.stringify(file2Data, null, 2)}
                      </SyntaxHighlighter>
                  </div>
                )}
            </div>
        </details>
      </section>
    </aside>
  );
}