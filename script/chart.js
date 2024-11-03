// // Cash - Trade - Token Chart
// const cashVsTokenChart = document.getElementById('CashOut').getContext('2d');
// new Chart(cashVsTokenChart, {
//     type: 'line',
//     data: {
//         labels: ['January', 'February', 'March', 'April', 'May', 'June'], // Example months
//         datasets: [
//             {
//                 label: 'Cash',
//                 data: [5000, 10000, 7500, 11000, 13000, 9000],
//                 borderColor: 'rgb(75, 192, 192)',
//                 fill: false,
//             },
//             {
//                 label: 'Trade',
//                 data: [4000, 6000, 7000, 9000, 10000, 8500],
//                 borderColor: 'rgb(255, 159, 64)',
//                 fill: false,
//             },

//         ],
//     },
//     options: {
//         responsive: true,
//         plugins: {
//             legend: {
//                 display: true,
//                 position: 'top',
//             },
//         },
//     },
// });

// // Remaining Cash - Remaining Token Chart
// const remainingCashVsTokenChart = document.getElementById('TopUp').getContext('2d');
// new Chart(remainingCashVsTokenChart, {
//     type: 'line',
//     data: {
//         labels: ['January', 'February', 'March', 'April', 'May', 'June'], // Example months
//         datasets: [
//             {
//                 label: 'Remaining Cash',
//                 data: [2000, 3000, 2500, 4000, 3500, 2800],
//                 borderColor: 'rgb(54, 162, 235)',
//                 fill: false,
//             },
//             {
//                 label: 'Remaining Token',
//                 data: [1500, 2000, 1800, 2200, 2500, 2100],
//                 borderColor: 'rgb(255, 99, 132)',
//                 fill: false,
//             },
//         ],
//     },
//     options: {
//         responsive: true,
//         plugins: {
//             legend: {
//                 display: true,
//                 position: 'top',
//             },
//         },
//     },
// });

// // Top Tasks, Top Clients, Top Gig Workers Charts
// const createRankingChart = (id, label, data, color) => {
//     const ctx = document.getElementById(id).getContext('2d');
//     new Chart(ctx, {
//         type: 'bar',
//         data: {
//             labels: ['1st', '2nd', '3rd'], // Example rankings
//             datasets: [{
//                 label: label,
//                 data: data,
//                 backgroundColor: color,
//             }],
//         },
//         options: {
//             responsive: true,
//             plugins: {
//                 legend: {
//                     display: false,
//                 },
//             },
//             scales: {
//                 y: {
//                     beginAtZero: true,
//                 },
//             },
//         },
//     });
// };

// // Creating the ranking charts
// createRankingChart('topTasksChart', 'Tasks', [15, 10, 8], 'rgba(75, 192, 192, 0.6)');
// createRankingChart('topClientsChart', 'Clients', [20, 14, 9], 'rgba(255, 159, 64, 0.6)');
// createRankingChart('topGigWorkersChart', 'Gig Workers', [18, 16, 12], 'rgba(153, 102, 255, 0.6)');

// Import necessary Firebase Firestore functions
// Import necessary Firebase Firestore functions
// // Import necessary Firebase Firestore functions
// import { db } from "../firebase.js"; // Your Firebase configuration
// import {
//   collection,
//   getDocs,
// } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// // Function to fetch data from Firebase and update the chart
// async function updateCashVsTokenChart() {
//   const cashVsTokenChart = document.getElementById('CashOut').getContext('2d');

//   // Reference to the walletTopUp collection in Firebase
//   const walletTopUpRef = collection(db, 'walletTopUp');

//   // Fetch documents from the collection
//   const snapshot = await getDocs(walletTopUpRef);

//   // Initialize data structure to hold amounts by month
//   const amountsByMonth = {
//     August: 0,
//     September: 0,
//     October: 0,
//     November: 0,
//     December: 0,
//   };

//   // Process each document in the snapshot
//   snapshot.forEach(doc => {
//     const data = doc.data();
//     const amount = data.amount; // Get the cashout amount
//     const currentTime = data.currentTime.toDate(); // Convert Firestore timestamp to Date object
//     const month = currentTime.toLocaleString('default', { month: 'long' }); // Get the month name

//     // Log each transaction processed
//     console.log(`Processing transaction: ${amount} in ${month}`);

//     // Only include cashouts from August to December
//     if (amount > 0 && amountsByMonth.hasOwnProperty(month)) {
//       amountsByMonth[month] += amount; // Sum amounts by month
//     }
//   });

//   // Log the summarized amounts for each month
//   console.log("Summary of Cash Out Amounts:");
//   for (const month in amountsByMonth) {
//     console.log(`${month}: ${amountsByMonth[month]}`);
//   }

//   // Prepare data for the chart
//   const labels = Object.keys(amountsByMonth); // Months as labels
//   const cashOutData = Object.values(amountsByMonth); // Corresponding amounts

//   // Create or update the chart
//   new Chart(cashVsTokenChart, {
//     type: 'line',
//     data: {
//       labels: labels,
//       datasets: [
//         {
//           label: 'Cash Out Amount',
//           data: cashOutData,
//           borderColor: 'rgb(75, 192, 192)', // Line color
//           fill: false, // No fill under the line
//         },
//       ],
//     },
//     options: {
//       responsive: true,
//       plugins: {
//         legend: {
//           display: true,
//           position: 'top',
//         },
//       },
//     },
//   });
// }

// // Call the function to update the chart
// updateCashVsTokenChart().catch(console.error);

// Import necessary Firebase Firestore functions
import { db } from "../firebase.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Function to fetch data from Firebase and update the charts
async function updateCharts() {
  // Get contexts for both charts
  const cashOutChartCtx = document
    .getElementById("cashOutChart")
    .getContext("2d");
  const topUpChartCtx = document.getElementById("topUpChart").getContext("2d");

  // Reference to the walletTopUp collection in Firebase
  const walletTopUpRef = collection(db, "walletTopUp");

  // Fetch documents from the collection
  const snapshot = await getDocs(walletTopUpRef);

  // Initialize data structures to hold amounts by month
  const amountsByMonth = {
    August: { cashOut: 0, topUp: 0 },
    September: { cashOut: 0, topUp: 0 },
    October: { cashOut: 0, topUp: 0 },
    November: { cashOut: 0, topUp: 0 },
    December: { cashOut: 0, topUp: 0 },
  };

  // Process each document in the snapshot
  snapshot.forEach((doc) => {
    const data = doc.data();
    const amount = data.amount; // Get the amount
    const currentTime = data.currentTime.toDate(); // Convert Firestore timestamp to Date object
    const month = currentTime.toLocaleString("default", { month: "long" }); // Get the month name
    const transactionType = data.typeoftransaction; // Get the transaction type

    // Log each transaction processed
    console.log(
      `Processing transaction: ${amount} in ${month} of type ${transactionType}`
    );

    // Only include transactions from August to December
    if (amount > 0 && amountsByMonth.hasOwnProperty(month)) {
      if (transactionType === "CashOut") {
        amountsByMonth[month].cashOut += amount; // Sum cash out amounts
      } else if (transactionType === "TopUp") {
        amountsByMonth[month].topUp += amount; // Sum top-up amounts
      }
    }
  });

  // Log the summarized amounts for each month
  console.log("Summary of Cash Out and Top Up Amounts:");
  for (const month in amountsByMonth) {
    console.log(
      `${month}: Cash Out: ${amountsByMonth[month].cashOut}, Top Up: ${amountsByMonth[month].topUp}`
    );
  }

  // Prepare data for cash out chart
  const cashOutLabels = Object.keys(amountsByMonth); // Months as labels
  const cashOutData = Object.values(amountsByMonth).map(
    (monthData) => monthData.cashOut
  ); // Cash out amounts

  // Create cash out chart
  new Chart(cashOutChartCtx, {
    type: "line",
    data: {
      labels: cashOutLabels,
      datasets: [
        {
          label: "Cash Out Amount",
          data: cashOutData,
          borderColor: "rgb(75, 192, 192)", // Line color for Cash Out
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
      },
    },
  });

  // Prepare data for top up chart
  const topUpData = Object.values(amountsByMonth).map(
    (monthData) => monthData.topUp
  ); // Top-up amounts

  // Create top up chart
  new Chart(topUpChartCtx, {
    type: "line",
    data: {
      labels: cashOutLabels,
      datasets: [
        {
          label: "Top Up Amount",
          data: topUpData,
          borderColor: "rgb(255, 159, 64)", // Line color for Top Up
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
      },
    },
  });
}

// Call the function to update the charts
updateCharts().catch(console.error);
