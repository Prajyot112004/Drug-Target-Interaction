const API_URL = "http://127.0.0.1:5000";

let scatterChart = null;
let importanceChart = null;
let residualChart = null;

async function fetchFeatureImportance() {
    try {
        const response = await fetch(`${API_URL}/feature_importance`);
        const data = await response.json();
        return data.importance || [];
    } catch (e) {
        console.error("Could not fetch feature importance");
        return [];
    }
}

async function refreshFeatureImportance() {
    const importance = await fetchFeatureImportance();
    if (importance.length > 0) {
        updateImportanceChart(importance);
    }
}

function updateImportanceChart(data) {
    const ctx = document.getElementById('importanceChart').getContext('2d');
    if (importanceChart) importanceChart.destroy();

    importanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.feature),
            datasets: [{
                label: 'Importance',
                data: data.map(item => item.importance),
                backgroundColor: '#22d3ee',
                borderColor: '#06b67f',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}

async function fetchEvaluationData() {
    try {
        const response = await fetch(`${API_URL}/evaluation_data`);
        if (!response.ok) throw new Error("Failed");
        return await response.json();
    } catch (e) {
        console.error("Could not fetch evaluation data");
        return null;
    }
}

function createScatterChart(actual, predicted) {
    const ctx = document.getElementById('scatterChart').getContext('2d');
    if (scatterChart) scatterChart.destroy();

    const points = actual.map((act, i) => ({ x: act, y: predicted[i] }));
    const minVal = Math.min(...actual, ...predicted);
    const maxVal = Math.max(...actual, ...predicted);

    scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                { label: 'Predictions', data: points, backgroundColor: '#22d3ee', borderColor: '#06b67f', borderWidth: 1, pointRadius: 4 },
                { label: 'Perfect Prediction', data: [{ x: minVal, y: minVal }, { x: maxVal, y: maxVal }], type: 'line', borderColor: '#94a3b8', borderDash: [6, 6], borderWidth: 1.5, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Actual pKd' } },
                y: { title: { display: true, text: 'Predicted pKd' } }
            }
        }
    });
}

function binResiduals(residuals, binCount = 15) {
    const min = Math.min(...residuals);
    const max = Math.max(...residuals);
    const binWidth = (max - min) / binCount || 1;
    const counts = new Array(binCount).fill(0);
    residuals.forEach(r => {
        let idx = Math.floor((r - min) / binWidth);
        if (idx >= binCount) idx = binCount - 1;
        if (idx < 0) idx = 0;
        counts[idx]++;
    });
    const labels = counts.map((_, i) => {
        const start = min + i * binWidth;
        const end = start + binWidth;
        return `${start.toFixed(2)} to ${end.toFixed(2)}`;
    });
    return { labels, counts };
}

function createResidualChart(residuals) {
    const ctx = document.getElementById('residualChart').getContext('2d');
    if (residualChart) residualChart.destroy();
    const { labels, counts } = binResiduals(residuals, 15);

    residualChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Count',
                data: counts,
                backgroundColor: '#22d3ee',
                borderColor: '#06b67f',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { title: { display: true, text: 'Residual (Actual − Predicted)' }, ticks: { maxRotation: 60 } },
                y: { title: { display: true, text: 'Count' }, beginAtZero: true }
            }
        }
    });
}

async function loadAllData() {
    const [importance, evalData] = await Promise.all([
        fetchFeatureImportance(),
        fetchEvaluationData()
    ]);

    updateImportanceChart(importance);

    if (evalData) {
        createScatterChart(evalData.actual, evalData.predicted);
        createResidualChart(evalData.residuals);

        document.getElementById('rmse').textContent = evalData.rmse.toFixed(4);
        document.getElementById('mae').textContent = evalData.mae.toFixed(4);
        document.getElementById('r2').textContent = evalData.r2.toFixed(4);
    }
}

window.onload = loadAllData;