// Cash - Trade - Token Chart
const cashVsTokenChart = document.getElementById('cashVsTokenChart').getContext('2d');
new Chart(cashVsTokenChart, {
    type: 'line',
    data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June'], // Example months
        datasets: [
            {
                label: 'Cash',
                data: [5000, 10000, 7500, 11000, 13000, 9000],
                borderColor: 'rgb(75, 192, 192)',
                fill: false,
            },
            {
                label: 'Trade',
                data: [4000, 6000, 7000, 9000, 10000, 8500],
                borderColor: 'rgb(255, 159, 64)',
                fill: false,
            },
         
        ],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: 'top',
            },
        },
    },
});

// Remaining Cash - Remaining Token Chart
const remainingCashVsTokenChart = document.getElementById('remainingCashVsTokenChart').getContext('2d');
new Chart(remainingCashVsTokenChart, {
    type: 'line',
    data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June'], // Example months
        datasets: [
            {
                label: 'Remaining Cash',
                data: [2000, 3000, 2500, 4000, 3500, 2800],
                borderColor: 'rgb(54, 162, 235)',
                fill: false,
            },
            {
                label: 'Remaining Token',
                data: [1500, 2000, 1800, 2200, 2500, 2100],
                borderColor: 'rgb(255, 99, 132)',
                fill: false,
            },
        ],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: 'top',
            },
        },
    },
});

// Top Tasks, Top Clients, Top Gig Workers Charts
const createRankingChart = (id, label, data, color) => {
    const ctx = document.getElementById(id).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1st', '2nd', '3rd'], // Example rankings
            datasets: [{
                label: label,
                data: data,
                backgroundColor: color,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
};

// Creating the ranking charts
createRankingChart('topTasksChart', 'Tasks', [15, 10, 8], 'rgba(75, 192, 192, 0.6)');
createRankingChart('topClientsChart', 'Clients', [20, 14, 9], 'rgba(255, 159, 64, 0.6)');
createRankingChart('topGigWorkersChart', 'Gig Workers', [18, 16, 12], 'rgba(153, 102, 255, 0.6)');
