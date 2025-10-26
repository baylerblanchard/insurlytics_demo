// public/app.js (Corrected)

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
    let myAnnualPerformanceChartInstance = null; 

    // === "COMPARE FILES" BUTTON LISTENER (CORRECTED) ===
    compareBtn.addEventListener('click', async () => {
        const file1 = fileInput1.files[0];
        // --- THIS LINE IS NOW FIXED ---
        const file2 = fileInput2.files[0]; 
        // --- (It was "fileleInput2") ---

        statusEl.textContent = "Uploading and parsing... Please wait.";
        compareBtn.classList.add('loading');
        compareBtn.disabled = true;

        if (!file1 && !file2) {
            statusEl.textContent = "Please select at least one file.";
            return;
        }

        file1Data = null;
        file2Data = null;
        outputEl1.textContent = "";
        outputEl2.textContent = "";
        comparisonDetailsEl.innerHTML = "";

        statusEl.textContent = "Uploading and parsing... Please wait.";

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
            const promises = [];
            if (file1) promises.push(parseFile(file1));
            if (file2) promises.push(parseFile(file2));

            const results = await Promise.all(promises);

            if (file1) {
                file1Data = results.shift();
                outputEl1.textContent = JSON.stringify(file1Data, null, 2);
            }
            if (file2) {
                file2Data = results.shift();
                outputEl2.textContent = JSON.stringify(file2Data, null, 2);
            }
            
            statusEl.textContent = "Parse complete! Charts updated.";
            
            renderAnnualPerformanceChart(file1Data, file2Data);
            renderComboChart(file1Data, file2Data);

        } catch (error) {
            console.error("Error:", error);
            statusEl.textContent = `An error occurred: ${error.message}`;
            compareBtn.classList.remove('loading');
            compareBtn.disabled = false;
        }
    });

    // === "GET DETAILS" BUTTON LISTENER (No change) ===
    compareAgeBtn.addEventListener('click', () => {
        const age = parseInt(compareAgeInput.value, 10);
        if (!age) {
            comparisonDetailsEl.innerHTML = "<p style='color: red;'>Please enter a valid age.</p>";
            return;
        }
        if (!file1Data) {
            comparisonDetailsEl.innerHTML = "<p style='color: red;'>Please parse at least one file first.</p>";
            return;
        }

        const findDataByAge = (age, data) => data.yearly_data.find(item => item.age === age);

        const data1_curr = findDataByAge(age, file1Data);
        const data1_prev = findDataByAge(age - 1, file1Data);
        const data2_curr = file2Data ? findDataByAge(age, file2Data) : null;
        const data2_prev = file2Data ? findDataByAge(age - 1, file2Data) : null;
        
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

        const annual1 = getAnnualData(data1_curr, data1_prev);
        const annual2 = getAnnualData(data2_curr, data2_prev);

        const format = (val) => val === null || val === undefined ? 'N/A' : `$${val.toLocaleString()}`;

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
                        <td>${format(data1_curr?.cumulative_premium)}</td>
                        <td>${format(data2_curr?.cumulative_premium)}</td>
                    </tr>
                    <tr>
                        <td>Net Cash Value</td>
                        <td>${format(data1_curr?.net_cash_value)}</td>
                        <td>${format(data2_curr?.net_cash_value)}</td>
                    </tr>
                    <tr>
                        <td>Net Death Benefit</td>
                        <td>${format(data1_curr?.net_death_benefit)}</td>
                        <td>${format(data2_curr?.net_death_benefit)}</td>
                    </tr>
                    <tr>
                        <td><strong>Net Gain / Loss</strong></td>
                        <td><strong>${format(annual1.netGain)}</strong></td>
                        <td><strong>${format(annual2.netGain)}</strong></td>
                    </tr>
                    <tr style="background-color: #f7f7f7;">
                        <td><strong>Annual Premium Paid</strong></td>
                        <td><strong>${format(annual1.premium)}</strong></td>
                        <td><strong>${format(annual2.premium)}</strong></td>
                    </tr>
                    <tr style="background-color: #f7f7f7;">
                        <td><strong>Annual Cash Value Growth</strong></td>
                        <td><strong>${format(annual1.growth)}</strong></td>
                        <td><strong>${format(annual2.growth)}</strong></td>
                    </tr>
                </tbody>
            </table>
        `;
    });
    
    // --- Helper functions (No change) ---
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

    // --- RENDER FUNCTION 1: ANNUAL PERFORMANCE (No change) ---
    function renderAnnualPerformanceChart(apiData1, apiData2) {
        const ctx = document.getElementById('annualPerformanceChart').getContext('2d');

        const calculateAnnualData = (yearlyData) => {
            let annualPremiums = [];
            let annualGrowth = [];
            for (let i = 0; i < yearlyData.length; i++) {
                const curr = yearlyData[i];
                const prev = i > 0 ? yearlyData[i - 1] : null;
                
                const prevPremium = prev ? prev.cumulative_premium : 0;
                const prevGrowth = prev ? prev.net_cash_value : 0;
                
                annualPremiums.push(curr.cumulative_premium - prevPremium);
                annualGrowth.push(curr.net_cash_value - prevGrowth);
            }
            return { annualPremiums, annualGrowth };
        };

        const labels = getCombinedLabels(apiData1, apiData2);
        
        const data1Map = new Map(apiData1.yearly_data.map(item => [item.age, item]));
        const fullData1 = labels.map(age => data1Map.get(age) || null);
        const { annualPremiums: annualPremiums1, annualGrowth: annualGrowth1 } = calculateAnnualData(fullData1);
        
        let datasets = [
            { label: 'File 1 - Annual Premium', data: annualPremiums1, borderColor: 'red', backgroundColor: 'rgba(255, 99, 132, 0.6)', type: 'bar' },
            { label: 'File 1 - Annual CV Growth', data: annualGrowth1, borderColor: 'blue', backgroundColor: 'blue', fill: false, type: 'line', tension: 0.1 }
        ];

        if (apiData2) {
            const data2Map = new Map(apiData2.yearly_data.map(item => [item.age, item]));
            const fullData2 = labels.map(age => data2Map.get(age) || null);
            const { annualPremiums: annualPremiums2, annualGrowth: annualGrowth2 } = calculateAnnualData(fullData2);
            
            datasets.push(
                { label: 'File 2 - Annual Premium', data: annualPremiums2, borderColor: 'orange', backgroundColor: 'rgba(255, 159, 64, 0.6)', type: 'bar' },
                { label: 'File 2 - Annual CV Growth', data: annualGrowth2, borderColor: 'cyan', backgroundColor: 'cyan', fill: false, type: 'line', tension: 0.1 }
            );
        }

        if (myAnnualPerformanceChartInstance) {
            myAnnualPerformanceChartInstance.destroy();
        }

        const chartTitle = apiData2 ? 'Annual Performance (Side-by-Side)' : 'Annual Performance (File 1)';

        myAnnualPerformanceChartInstance = new Chart(ctx, {
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

    // --- RENDER FUNCTION 2: COMBO CHART (No change) ---
    function renderComboChart(apiData1, apiData2) {
        const ctx = document.getElementById('comboChart').getContext('2d');
        const labels = getCombinedLabels(apiData1, apiData2);
        
        const premiumData1 = mapDataToLabels(labels, apiData1.yearly_data).map(item => item ? item.cumulative_premium : null);
        const cashValueData1 = mapDataToLabels(labels, apiData1.yearly_data).map(item => item ? item.net_cash_value : null);

        let datasets = [
            { label: 'File 1 - Cash Value', data: cashValueData1, borderColor: 'blue', backgroundColor: 'blue', fill: false, type: 'line', tension: 0.1 },
            { label: 'File 1 - Premium', data: premiumData1, borderColor: 'red', backgroundColor: 'rgba(255, 99, 132, 0.6)' }
        ];

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