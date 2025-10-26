// public/app.js (Updated with Dual Mode)

document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "http://localhost:9292"; 

    // --- DOM elements ---
    const fileInput1 = document.getElementById('pdfFile1');
    const fileInput2 = document.getElementById('pdfFile2');
    const compareBtn = document.getElementById('compareBtn');
    const statusEl = document.getElementById('status');
    const outputEl1 = document.getElementById('output1');
    const outputEl2 = document.getElementById('output2');
    
    const compareAgeInput = document.getElementById('compareAge');
    const compareAgeBtn = document.getElementById('compareAgeBtn');
    const comparisonDetailsEl = document.getElementById('comparisonDetails');

    // --- Global data variables ---
    let file1Data = null;
    let file2Data = null;

    // --- Chart instances ---
    let myComboChartInstance = null;
    let myNetGainChartInstance = null;

    // === "COMPARE FILES" BUTTON LISTENER (UPDATED) ===
    compareBtn.addEventListener('click', async () => {
        const file1 = fileInput1.files[0];
        const file2 = fileInput2.files[0];

        if (!file1 && !file2) {
            statusEl.textContent = "Please select at least one file.";
            return;
        }

        // Reset data on each click
        file1Data = null;
        file2Data = null;
        outputEl1.textContent = "";
        outputEl2.textContent = "";
        comparisonDetailsEl.innerHTML = ""; // Clear old age comparison

        statusEl.textContent = "Uploading and parsing... Please wait.";

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

        try {
            // Create a list of promises to run
            const promises = [];
            if (file1) promises.push(parseFile(file1));
            if (file2) promises.push(parseFile(file2));

            // Run all parse requests
            const results = await Promise.all(promises);

            // Assign results
            if (file1) {
                file1Data = results.shift(); // Get the first result
                outputEl1.textContent = JSON.stringify(file1Data, null, 2);
            }
            if (file2) {
                file2Data = results.shift(); // Get the second result (if it exists)
                outputEl2.textContent = JSON.stringify(file2Data, null, 2);
            }
            
            statusEl.textContent = "Parse complete! Charts updated.";
            
            // Call render functions. They will intelligently handle 1 or 2 files.
            renderNetGainChart(file1Data, file2Data);
            renderComboChart(file1Data, file2Data);

        } catch (error) {
            console.error("Error:", error);
            statusEl.textContent = `An error occurred: ${error.message}`;
        }
    });

    // === "GET DETAILS" BUTTON LISTENER (UPDATED) ===
    compareAgeBtn.addEventListener('click', () => {
        const age = parseInt(compareAgeInput.value, 10);
        if (!age) {
            comparisonDetailsEl.innerHTML = "<p style='color: red;'>Please enter a valid age.</p>";
            return;
        }
        if (!file1Data) { // Only need to check for File 1
            comparisonDetailsEl.innerHTML = "<p style='color: red;'>Please parse at least one file first.</p>";
            return;
        }

        // Helper function
        const findDataByAge = (age, data) => data.yearly_data.find(item => item.age === age);

        const data1 = findDataByAge(age, file1Data);
        // Check if file2Data exists before trying to find data in it
        const data2 = file2Data ? findDataByAge(age, file2Data) : null; 
        
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
    
    // --- Helper function (UPDATED) ---
    const getCombinedLabels = (data1, data2) => {
        const ages1 = data1.yearly_data.map(item => item.age);
        // Handle case where data2 is null
        const ages2 = data2 ? data2.yearly_data.map(item => item.age) : []; 
        const allAges = [...new Set([...ages1, ...ages2])]; 
        return allAges.sort((a, b) => a - b);
    };
    
    // --- Helper function (no change) ---
    const mapDataToLabels = (labels, data) => {
        const dataMap = new Map(data.map(item => [item.age, item]));
        return labels.map(age => dataMap.get(age) || null); 
    };

    // --- RENDER FUNCTION 1: NET GAIN/LOSS (UPDATED) ---
    function renderNetGainChart(apiData1, apiData2) {
        const ctx = document.getElementById('netGainChart').getContext('2d');
        
        const labels = getCombinedLabels(apiData1, apiData2);
        const netGainData1 = mapDataToLabels(labels, apiData1.yearly_data).map(item => item ? item.net_cash_value - item.cumulative_premium : null);

        // Dynamically build the datasets array
        let datasets = [
            {
                label: 'File 1 - Net Gain/Loss',
                data: netGainData1,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
            }
        ];

        // If File 2 exists, add it to the chart
        if (apiData2) {
            const netGainData2 = mapDataToLabels(labels, apiData2.yearly_data).map(item => item ? item.net_cash_value - item.cumulative_premium : null);
            datasets.push({
                label: 'File 2 - Net Gain/Loss',
                data: netGainData2,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
            });
        }

        if (myNetGainChartInstance) {
            myNetGainChartInstance.destroy();
        }

        // Set title based on 1 or 2 files
        const chartTitle = apiData2 ? 'Net Gain / Loss Comparison' : 'Net Gain / Loss (File 1)';

        myNetGainChartInstance = new Chart(ctx, {
            type: 'bar',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: chartTitle },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: { title: { display: true, text: 'Age' } },
                    y: { title: { display: true, text: 'Net Gain ($)' } }
                }
            }
        });
    }

    // --- RENDER FUNCTION 2: COMBO CHART (UPDATED) ---
    function renderComboChart(apiData1, apiData2) {
        const ctx = document.getElementById('comboChart').getContext('2d');
        
        const labels = getCombinedLabels(apiData1, apiData2);
        
        // File 1 data is always present
        const premiumData1 = mapDataToLabels(labels, apiData1.yearly_data).map(item => item ? item.cumulative_premium : null);
        const cashValueData1 = mapDataToLabels(labels, apiData1.yearly_data).map(item => item ? item.net_cash_value : null);

        // Dynamically build the datasets array
        let datasets = [
            { label: 'File 1 - Cash Value', data: cashValueData1, borderColor: 'blue', backgroundColor: 'blue', fill: false, type: 'line', tension: 0.1 },
            { label: 'File 1 - Premium', data: premiumData1, borderColor: 'red', backgroundColor: 'rgba(255, 99, 132, 0.6)' }
        ];

        // If File 2 exists, add its data
        if (apiData2) {
            const premiumData2 = mapDataToLabels(labels, apiData2.yearly_data).map(item => item ? item.cumulative_premium : null);
            const cashValueData2 = mapDataToLabels(labels, apiData2.yearly_data).map(item => item ? item.net_cash_value : null);
            datasets.push(
                { label: 'File 2 - Cash Value', data: cashValueData2, borderColor: 'cyan', backgroundColor: 'cyan', fill: false, type: 'line', tension: 0.1 },
                { label: 'File 2 - Premium', data: premiumData2, borderColor: 'orange', backgroundColor: 'rgba(255, 159, 64, 0.6)' }
            );
        }

        if (myComboChartInstance) {
            myComboChartInstance.destroy();
        }

        // Set title based on 1 or 2 files
        const chartTitle = apiData2 ? 'Policy Value vs. Premium (Side-by-Side)' : 'Policy Value vs. Premium (File 1)';

        myComboChartInstance = new Chart(ctx, {
            type: 'bar', 
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                plugins: { 
                    title: { display: true, text: chartTitle },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: { title: { display: true, text: 'Age' } },
                    y: { title: { display: true, text: 'Value ($)' } }
                }
            }
        });
    }

}); // End of DOMContentLoaded