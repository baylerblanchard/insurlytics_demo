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

// --- HELPER FUNCTIONS (Your old logic) ---
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

const calculateAnnualData = (yearlyData) => {
    let annualPremiums = [];
    let annualGrowth = [];
    for (let i = 0; i < yearlyData.length; i++) {
        const curr = yearlyData[i];
        if (!curr) { // Handle nulls (gaps in data)
          annualPremiums.push(null);
          annualGrowth.push(null);
          continue;
        }
        const prev = i > 0 ? yearlyData[i - 1] : null;
        
        const prevPremium = prev ? prev.cumulative_premium : 0;
        const prevGrowth = prev ? prev.net_cash_value : 0;
        
        annualPremiums.push(curr.cumulative_premium - prevPremium);
        annualGrowth.push(curr.net_cash_value - prevGrowth);
    }
    return { annualPremiums, annualGrowth };
};
// --- END OF HELPERS ---


export function MainContent({ file1Data, file2Data }) {
  const [activeTab, setActiveTab] = useState('annual');

  // === THIS IS THE FULLY IMPLEMENTED LOGIC ===
  const { annualData, comboData } = useMemo(() => {
    if (!file1Data) return { annualData: null, comboData: null };
    
    const labels = getCombinedLabels(file1Data, file2Data);
    
    // --- 1. Calculate Annual Performance Data ---
    const data1Map = new Map(file1Data.yearly_data.map(item => [item.age, item]));
    const fullData1 = labels.map(age => data1Map.get(age) || null);
    const { annualPremiums: annualPremiums1, annualGrowth: annualGrowth1 } = calculateAnnualData(fullData1);
    
    let annualDatasets = [
        { label: 'File 1 - Annual Premium', data: annualPremiums1, borderColor: 'red', backgroundColor: 'rgba(255, 99, 132, 0.6)', type: 'bar' },
        { label: 'File 1 - Annual CV Growth', data: annualGrowth1, borderColor: 'blue', backgroundColor: 'blue', fill: false, type: 'line', tension: 0.1 }
    ];

    if (file2Data) {
        const data2Map = new Map(file2Data.yearly_data.map(item => [item.age, item]));
        const fullData2 = labels.map(age => data2Map.get(age) || null);
        const { annualPremiums: annualPremiums2, annualGrowth: annualGrowth2 } = calculateAnnualData(fullData2);
        annualDatasets.push(
            { label: 'File 2 - Annual Premium', data: annualPremiums2, borderColor: 'orange', backgroundColor: 'rgba(255, 159, 64, 0.6)', type: 'bar' },
            { label: 'File 2 - Annual CV Growth', data: annualGrowth2, borderColor: 'cyan', backgroundColor: 'cyan', fill: false, type: 'line', tension: 0.1 }
        );
    }

    // --- 2. Calculate Combo (Cumulative) Chart Data ---
    const premiumData1 = mapDataToLabels(labels, file1Data.yearly_data).map(item => item ? item.cumulative_premium : null);
    const cashValueData1 = mapDataToLabels(labels, file1Data.yearly_data).map(item => item ? item.net_cash_value : null);

    let comboDatasets = [
        { label: 'File 1 - Cash Value', data: cashValueData1, borderColor: 'blue', backgroundColor: 'blue', fill: false, type: 'line', tension: 0.1 },
        { label: 'File 1 - Premium', data: premiumData1, borderColor: 'red', backgroundColor: 'rgba(255, 99, 132, 0.6)' }
    ];

    if (file2Data) {
        const premiumData2 = mapDataToLabels(labels, file2Data.yearly_data).map(item => item ? item.cumulative_premium : null);
        const cashValueData2 = mapDataToLabels(labels, file2Data.yearly_data).map(item => item ? item.net_cash_value : null);
        comboDatasets.push(
            { label: 'File 2 - Cash Value', data: cashValueData2, borderColor: 'cyan', backgroundColor: 'cyan', fill: false, type: 'line', tension: 0.1 },
            { label: 'File 2 - Premium', data: premiumData2, borderColor: 'orange', backgroundColor: 'rgba(255, 159, 64, 0.6)' }
        );
    }
    
    // --- 3. Return the final, formatted objects ---
    return {
      annualData: {
          labels: labels,
          datasets: annualDatasets
      },
      comboData: {
          labels: labels,
          datasets: comboDatasets
      }
    };

  }, [file1Data, file2Data]); // This is the dependency array

  // If we have no data, show the welcome message
  if (!file1Data) {
    return (
      <main className="main-content">
        <div id="welcome-message" className="welcome-container">
          <h2>Welcome to the Insurlytics Demo</h2>
          <p>Please upload one or two PDF files using the panel on the left to begin the analysis.</p>
        </div>
      </main>
    );
  }

  // Chart.js options
  const chartOptions = (title) => ({
      responsive: true, 
      plugins: { 
          title: { display: true, text: title }, 
          tooltip: { mode: 'index', intersect: false }
      }, 
      scales: { 
          x: { title: { display: true, text: 'Age' }}, 
          y: { title: { display: true, text: 'Value ($)' }}
      },
      animation: {
          duration: 800,
          easing: 'easeOutQuart',
      }
  });

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

      {/* --- Chart Renderer --- */}
      <div className={`tab-content ${activeTab === 'annual' ? 'active' : ''}`}>
        <Bar 
          data={annualData} 
          options={chartOptions(file2Data ? 'Annual Performance (Side-by-Side)' : 'Annual Performance (File 1)')}
        />
      </div>

      <div className={`tab-content ${activeTab === 'combo' ? 'active' : ''}`}>
        <Bar 
          data={comboData} 
          options={chartOptions(file2Data ? 'Cumulative Value vs. Premium (Side-by-Side)' : 'Cumulative Value vs. Premium (File 1)')}
        />
      </div>
    </main>
  );
}