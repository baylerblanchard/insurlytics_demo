import React, { useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

// --- HELPER FUNCTIONS ---
const getCombinedLabels = (data1, data2) => {
    const ages1 = data1.yearly_data.map(item => Number(item.age));
    const ages2 = data2 ? data2.yearly_data.map(item => Number(item.age)) : []; 
    const allAges = [...new Set([...ages1, ...ages2])]; 
    return allAges.sort((a, b) => a - b);
};

// THIS IS THE KEY NEW FUNCTION
// It grabs raw data fields directly from your new JSON
const mapDataField = (labels, data, field) => {
    const dataMap = new Map(data.map(item => [Number(item.age), item[field]]));
    return labels.map(age => dataMap.get(age) || null); 
};
// ------------------------

export function MainContent({ file1Data, file2Data }) {
  const [activeTab, setActiveTab] = useState('annual');

  const { annualData, comboData } = useMemo(() => {
    if (!file1Data) return { annualData: null, comboData: null };
    
    const labels = getCombinedLabels(file1Data, file2Data);
    
    // --- 1. ANNUAL PERFORMANCE DATA ---
    // We now use mapDataField to grab 'annual_premium' directly.
    // No more complex calculations here!
    const annualPrem1 = mapDataField(labels, file1Data.yearly_data, 'annual_premium');
    
    // For Annual Growth, we still calculate it as the change in Net Cash Value
    const annualGrowth1 = labels.map((age) => {
       const curr = file1Data.yearly_data.find(d => Number(d.age) === age);
       const prev = file1Data.yearly_data.find(d => Number(d.age) === (age - 1));
       if (!curr) return null;
       return curr.net_cash_value - (prev ? prev.net_cash_value : 0);
    });

    let annualDatasets = [
        { label: 'File 1 - Annual Premium', data: annualPrem1, borderColor: 'red', backgroundColor: 'rgba(255, 99, 132, 0.6)', type: 'bar' },
        { label: 'File 1 - Annual CV Growth', data: annualGrowth1, borderColor: 'blue', backgroundColor: 'blue', fill: false, type: 'line', tension: 0.1 }
    ];

    if (file2Data) {
        const annualPrem2 = mapDataField(labels, file2Data.yearly_data, 'annual_premium');
        const annualGrowth2 = labels.map((age) => {
           const curr = file2Data.yearly_data.find(d => Number(d.age) === age);
           const prev = file2Data.yearly_data.find(d => Number(d.age) === (age - 1));
           if (!curr) return null;
           return curr.net_cash_value - (prev ? prev.net_cash_value : 0);
        });

        annualDatasets.push(
            { label: 'File 2 - Annual Premium', data: annualPrem2, borderColor: 'orange', backgroundColor: 'rgba(255, 159, 64, 0.6)', type: 'bar' },
            { label: 'File 2 - Annual CV Growth', data: annualGrowth2, borderColor: 'cyan', backgroundColor: 'cyan', fill: false, type: 'line', tension: 0.1 }
        );
    }

    // --- 2. CUMULATIVE (COMBO) DATA ---
    // We also use mapDataField here for cleaner code
    const cumulativePrem1 = mapDataField(labels, file1Data.yearly_data, 'cumulative_premium');
    const cashValue1 = mapDataField(labels, file1Data.yearly_data, 'net_cash_value');

    let comboDatasets = [
        { label: 'File 1 - Cash Value', data: cashValue1, borderColor: 'blue', backgroundColor: 'blue', fill: false, type: 'line', tension: 0.1 },
        { label: 'File 1 - Cumulative Premium', data: cumulativePrem1, borderColor: 'red', backgroundColor: 'rgba(255, 99, 132, 0.6)', type: 'bar' }
    ];

    if (file2Data) {
        const cumulativePrem2 = mapDataField(labels, file2Data.yearly_data, 'cumulative_premium');
        const cashValue2 = mapDataField(labels, file2Data.yearly_data, 'net_cash_value');
        comboDatasets.push(
            { label: 'File 2 - Cash Value', data: cashValue2, borderColor: 'cyan', backgroundColor: 'cyan', fill: false, type: 'line', tension: 0.1 },
            { label: 'File 2 - Cumulative Premium', data: cumulativePrem2, borderColor: 'orange', backgroundColor: 'rgba(255, 159, 64, 0.6)', type: 'bar' }
        );
    }
    
    return {
      annualData: { labels, datasets: annualDatasets },
      comboData: { labels, datasets: comboDatasets }
    };

  }, [file1Data, file2Data]);

  if (!file1Data) {
    return (
      <main className="main-content">
        <div id="welcome-message" className="welcome-container">
          <h2>Welcome to the Policy Analyzer</h2>
          <p>Please log in and upload a PDF file using the panel on the left to begin.</p>
        </div>
      </main>
    );
  }

  const chartOptions = (title) => ({
      responsive: true, maintainAspectRatio: false,
      plugins: { 
          title: { display: true, text: title, font: { size: 16 } }, 
          tooltip: { mode: 'index', intersect: false }
      }, 
      scales: { x: { title: { display: true, text: 'Age' }}, y: { title: { display: true, text: 'Value ($)' }}}
  });

  return (
    <main className="main-content">
      <nav className="chart-tabs">
        <button className={`tab-link ${activeTab === 'annual' ? 'active' : ''}`} onClick={() => setActiveTab('annual')}>Annual Performance</button>
        <button className={`tab-link ${activeTab === 'combo' ? 'active' : ''}`} onClick={() => setActiveTab('combo')}>Cumulative Value</button>
      </nav>
      <div className={`tab-content ${activeTab === 'annual' ? 'active' : ''}`} style={{ height: '500px' }}>
        <Bar data={annualData} options={chartOptions('Annual Performance (Premium vs Growth)')} />
      </div>
      <div className={`tab-content ${activeTab === 'combo' ? 'active' : ''}`} style={{ height: '500px' }}>
        <Bar data={comboData} options={chartOptions('Cumulative Value vs. Total Paid')} />
      </div>
    </main>
  );
}