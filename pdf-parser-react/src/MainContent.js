// src/MainContent.js
import React, { useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

// We have to "register" the parts of Chart.js we're using
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend
);

// --- HELPER FUNCTIONS (Your old logic, moved here) ---
const getCombinedLabels = (data1, data2) => {
    const ages1 = data1.yearly_data.map(item => item.age);
    const ages2 = data2 ? data2.yearly_data.map(item => item.age) : []; 
    const allAges = [...new Set([...ages1, ...ages2])]; 
    return allAges.sort((a, b) => a - b);
};

const mapDataToLabels = (labels, data) => {
    const dataMap = new Map(data.map(item => [item.age, item]));
    return labels.map(age => dataMap.get(age) || null); 
};
// --- END OF HELPERS ---


export function MainContent({ file1Data, file2Data }) {
  const [activeTab, setActiveTab] = useState('annual');

  // --- This is a React optimization ---
  // 'useMemo' prevents us from re-calculating the chart data on
  // every single re-render. It only re-calculates if file1Data
  // or file2Data actually change.
  const chartData = useMemo(() => {
    if (!file1Data) return null;
    
    const labels = getCombinedLabels(file1Data, file2Data);
    
    // Calculate Annual Performance Data
    const calculateAnnualData = (yearlyData) => { /* ... */ }; // (Your logic)
    const data1Map = new Map(file1Data.yearly_data.map(item => [item.age, item]));
    const fullData1 = labels.map(age => data1Map.get(age) || null);
    // ... (rest of your annual chart data logic) ...
    
    // Calculate Combo Chart Data
    const premiumData1 = mapDataToLabels(labels, file1Data.yearly_data).map(item => item ? item.cumulative_premium : null);
    // ... (rest of your combo chart data logic) ...

    return {
      annual: { /* ... chart data ... */ },
      combo: { /* ... chart data ... */ }
    };

  }, [file1Data, file2Data]); // This is the dependency array

  // If we have no data, show the welcome message
  if (!file1Data) {
    return (
      <main className="main-content">
        <div id="welcome-message" className="welcome-container">
          <h2>Welcome to the Policy Analyzer</h2>
          <p>Please upload one or two PDF files...</p>
        </div>
      </main>
    );
  }

  // If we DO have data, show the tabs and charts
  return (
    <main className="main-content">
      <nav className="chart-tabs">
        <button 
          className={`tab-link ${activeTab === 'annual' ? 'active' : ''}`}
          onClick={() => setActiveTab('annual')}
        >
          Annual Performance
        </button>
        <button 
          className={`tab-link ${activeTab === 'combo' ? 'active' : ''}`}
          onClick={() => setActiveTab('combo')}
        >
          Cumulative Value
        </button>
      </nav>

      {/* --- This is the chart renderer --- */}
      {/* We are passing the data we just calculated directly to the chart component. */}
      {activeTab === 'annual' && (
        <div className="chartContainer tab-content active">
          <Bar 
            data={chartData.annual} 
            options={{ /* ... your chart options ... */ }} 
          />
        </div>
      )}

      {activeTab === 'combo' && (
        <div className="chartContainer tab-content active">
          <Bar 
            data={chartData.combo} 
            options={{ /* ... your chart options ... */ }} 
          />
        </div>
      )}
    </main>
  );
}