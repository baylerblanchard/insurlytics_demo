// public/app.js

document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "http://localhost:9292"; 

    // --- All our DOM elements ---
    const fileInput1 = document.getElementById('pdfFile1');
    const fileInput2 = document.getElementById('pdfFile2');
    const compareBtn = document.getElementById('compareBtn');
    const statusEl = document.getElementById('status');
    const outputEl1 = document.getElementById('output1');
    const outputEl2 = document.getElementById('output2');
    
    const compareAgeInput = document.getElementById('compareAge');
    const compareAgeBtn = document.getElementById('compareAgeBtn');
    const comparisonDetailsEl = document.getElementById('comparisonDetails');

    // --- Global variables to store parsed data ---
    let file1Data = null;
    let file2Data = null;

    // --- Chart instances ---
    let myComboChartInstance = null;
    let myNetGainChartInstance = null;

    // === NEW "COMPARE FILES" BUTTON LISTENER ===
    compareBtn.addEventListener('click', async () => {
        const file1 = fileInput1.files[0];
        const file2 = fileInput2.files[0];

        if (!file1 || !file2) {
            statusEl.textContent = "Please select two PDF files to compare.";
            return;
        }

        statusEl.textContent = "Uploading and parsing files... Please wait.";
        outputEl1.textContent = "";
        outputEl2.textContent = "";

        try {
            // Helper function to parse a single file
            const parseFile = async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                const response = await fetch(API_URL + "/parse", {
                    method: 'POST',
                    body: formData,
                });
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(`Error parsing ${file.name}: ${err.error || response.statusText}`);
                }
                return response.json();
            };

            // Use Promise.all to parse both files concurrently
            const [data1, data2] = await Promise.all([
                parseFile(file1),
                parseFile(file2)
            ]);
            
            // Store data globally
            file1Data = data1;
            file2Data = data2;
            
            // Display JSON
            outputEl1.textContent = JSON.stringify(data1, null, 2);
            outputEl2.textContent = JSON.stringify(data2, null, 2);
            statusEl.textContent = "Comparison complete! Charts updated.";
            
            // Call render functions with both datasets
            renderNetGainChart(data1, data2);
            renderComboChart(data1, data2);

        } catch (error) {
            console.error("Error:", error);
            statusEl.textContent = `An error occurred: ${error.message}`;
        }
    });

    // === NEW "GET DETAILS" BUTTON LISTENER ===
    compareAgeBtn.addEventListener('click', () => {
        const age = parseInt(compareAgeInput.value, 10);
        if (!age) {
            comparisonDetailsEl.innerHTML = "<p style='color: red;'>Please enter a valid age.</p>";
            return;
        }
        if (!file1Data || !file2Data) {
            comparisonDetailsEl.innerHTML = "<p style='color: red;'>Please parse two files first.</p>";
            return;
        }

        // Helper function to find data for a specific age
        const findDataByAge = (age, data) => data.yearly_data.find(item => item.age === age);

        const data1 = findDataByAge(age, file1Data);
        const data2 = findDataByAge(age, file2Data);
        
        // Format the output as a table
        comparisonDetailsEl.innerHTML = `
            <h3>Comparison at Age ${age}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>File 1</th>
                        <th>File 2</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Cumulative Premium</td>
                        <td>${data1 ? `$${data1.cumulative_premium.toLocaleString()}` : 'N/A'}</td>
                        <td>${data2 ? `$${data2.cumulative_premium.toLocaleString()}` : 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>Net Cash Value</td>
                        <td>${data1 ? `$${data1.net_cash_value.toLocaleString()}` : 'N/A'}</td>
                        <td>${data2 ? `$${data2.net_cash_value.toLocaleString()}` : 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>Net Death Benefit</td>
                        <td>${data1 ? `$${data1.net_death_benefit.toLocaleString()}` : 'N/A'}</td>
                        <td>${data2 ? `$${data2.net_death_benefit.toLocaleString()}` : 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Net Gain / Loss</strong></td>
                        <td><strong>${data1 ? `$${(data1.net_cash_value - data1.cumulative_premium).toLocaleString()}` : 'N/A'}</strong></td>
                        <td><strong>${data2 ? `$${(data2.net_cash_value - data2.cumulative_premium).toLocaleString()}` : 'N/A'}</strong></td>
                    </tr>
                </tbody>
            </table>
        `;
    });
    
    // --- Helper function to merge age labels from both datasets ---
    const getCombinedLabels = (data1, data2) => {
        const ages1 = data1.yearly_data.map(item => item.age);
        const ages2 = data2.yearly_data.map(item => item.age);
        const allAges = [...new Set([...ages1, ...ages2])]; // Combine and remove duplicates
        return allAges.sort((a, b) => a - b); // Sort numerically
    };
    
    // --- Helper to map data to the full label list ---
    const mapDataToLabels = (labels, data) => {
        const dataMap = new Map(data.map(item => [item.age, item]));
        return labels.map(age => dataMap.get(age) || null); // Use null for missing data
    };

    // --- RENDER FUNCTION 1: NET GAIN/LOSS (UPDATED FOR 2 FILES) ---
    function renderNetGainChart(apiData1, apiData2) {
        const ctx = document.getElementById('netGainChart').getContext('2d');
        
        const labels = getCombinedLabels(apiData1, apiData2);
        
        const netGainData1 = mapDataToLabels(labels, apiData1.yearly_data).map(item => item ? item.net_cash_value - item.cumulative_premium : null);
        const netGainData2 = mapDataToLabels(labels, apiData2.yearly_data).map(item => item ? item.net_cash_value - item.cumulative_premium : null);

        if (myNetGainChartInstance) {
            myNetGainChartInstance.destroy();
        }

        myNetGainChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'File 1 - Net Gain/Loss',
                        data: netGainData1,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    },
                    {
                        label: 'File 2 - Net Gain/Loss',
                        data: netGainData2,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: 'Net Gain / Loss Comparison' },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: { title: { display: true, text: 'Age' } },
                    y: { title: { display: true, text: 'Net Gain ($)' } }
                }
            }
        });
    }

    // --- RENDER FUNCTION 2: COMBO CHART (UPDATED FOR 2 FILES) ---
    function renderComboChart(apiData1, apiData2) {
        const ctx = document.getElementById('comboChart').getContext('2d');
        
        const labels = getCombinedLabels(apiData1, apiData2);
        
        // Map all data to the combined labels
        const premiumData1 = mapDataToLabels(labels, apiData1.yearly_data).map(item => item ? item.cumulative_premium : null);
        const cashValueData1 = mapDataToLabels(labels, apiData1.yearly_data).map(item => item ? item.net_cash_value : null);
        const premiumData2 = mapDataToLabels(labels, apiData2.yearly_data).map(item => item ? item.cumulative_premium : null);
        const cashValueData2 = mapDataToLabels(labels, apiData2.yearly_data).map(item => item ? item.net_cash_value : null);

        if (myComboChartInstance) {
            myComboChartInstance.destroy();
        }

        myComboChartInstance = new Chart(ctx, {
            type: 'bar', 
            data: {
                labels: labels, 
                datasets: [
                    // File 1 Data
                    { label: 'File 1 - Cash Value', data: cashValueData1, borderColor: 'blue', backgroundColor: 'blue', fill: false, type: 'line', tension: 0.1 },
                    { label: 'File 1 - Premium', data: premiumData1, borderColor: 'red', backgroundColor: 'rgba(255, 99, 132, 0.6)' },
                    // File 2 Data
                    { label: 'File 2 - Cash Value', data: cashValueData2, borderColor: 'cyan', backgroundColor: 'cyan', fill: false, type: 'line', tension: 0.1 },
                    { label: 'File 2 - Premium', data: premiumData2, borderColor: 'orange', backgroundColor: 'rgba(255, 159, 64, 0.6)' }
                ]
            },
            options: {
                responsive: true,
                plugins: { 
                    title: { display: true, text: 'Policy Value vs. Premium (Side-by-Side)' },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: { title: { display: true, text: 'Age' } },
                    y: { title: { display: true, text: 'Value ($)' } }
                }
            }
        });
    }
});