// public/app.js

// --- POINT THIS TO YOUR LOCAL RUBY SERVER ---
// Puma's default port is 9292.
const API_URL = "http://localhost:9292"; 
// ------------------------------------------

const fileInput = document.getElementById('pdfFile');
const submitBtn = document.getElementById('submitBtn');
const outputEl = document.getElementById('output');
const statusEl = document.getElementById('status');
let myChartInstance = null;

submitBtn.addEventListener('click', async () => {
    // ... (rest of the code is identical to the previous version) ...
    const file = fileInput.files[0];
    if (!file) {
        statusEl.textContent = "Please select a PDF file first.";
        return;
    }
    statusEl.textContent = "Uploading and parsing... Please wait.";
    outputEl.textContent = "";
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await fetch(API_URL + "/parse", {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Server error: ${err.error || response.statusText}`);
        }
        const data = await response.json();
        outputEl.textContent = JSON.stringify(data, null, 2);
        statusEl.textContent = "Success!";
        renderChart(data);
    } catch (error) {
        console.error("Error:", error);
        statusEl.textContent = `An error occurred: ${error.message}`;
        outputEl.textContent = error.message;
    }
});

function renderChart(apiData) {
    const ctx = document.getElementById('myChart').getContext('2d');
    const labels = apiData.yearly_data.map(item => item.age);
    const cashValueData = apiData.yearly_data.map(item => item.net_cash_value);
    const deathBenefitData = apiData.yearly_data.map(item => item.net_death_benefit);
    const premiumData = apiData.yearly_data.map(item => item.cumulative_premium);

    if (myChartInstance) {
        myChartInstance.destroy();
    }
    myChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Net Cash Value',
                    data: cashValueData,
                    borderColor: 'blue',
                    fill: false,
                },
                {
                    label: 'Net Death Benefit',
                    data: deathBenefitData,
                    borderColor: 'green',
                    fill: false,
                },
                {
                    label: 'Cumulative Premium',
                    data: premiumData,
                    borderColor: 'red',
                    fill: false,
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Policy Value vs. Premium Over Time' } },
            scales: {
                x: { title: { display: true, text: 'Age' } },
                y: { title: { display: true, text: 'Value ($)' } }
            }
        }
    });
}