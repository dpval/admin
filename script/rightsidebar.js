import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js';
import { getFirestore, collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';
import Chart from 'https://cdn.jsdelivr.net/npm/chart.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOC-a_k4IEpdeW_Rms6v_V8jBgdTO2k5M",
  authDomain: "tradeare-us-2nx4zp.firebaseapp.com",
  projectId: "tradeare-us-2nx4zp",
  storageBucket: "tradeare-us-2nx4zp.appspot.com",
  messagingSenderId: "752862844692",
  appId: "1:752862844692:web:5d656e58696c44d5ef9401"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to fetch data from Firestore
const fetchData = async () => {
  try {
    const usersRef = collection(db, 'users');

    // Fetch pending approvals with specific firsttimestatus
    const pendingQuery = query(
      usersRef, 
      where('firsttimestatus', '==', 'pending'),
      where('usertype', 'in', ['client', 'applicant'])
    );
    const pendingSnapshot = await getDocs(pendingQuery);

    let clients = 0;
    let applicants = 0;

    pendingSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.usertype === 'client') {
        clients++;
      } else if (data.usertype === 'applicant') {
        applicants++;
      }
    });

    // Fetch active users
    const activeQuery = query(usersRef, where('status', 'in', ['active', 'inactive']));
    const activeSnapshot = await getDocs(activeQuery);

    let active = 2;
    let inactive = 4;

    activeSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'active') {
        active++;
      } else if (data.status === 'inactive') {
        inactive++;
      }
    });

    // Fetch alerts (assuming you have a separate collection for alerts)
    const alertsRef = collection(db, 'alerts');
    const alertsSnapshot = await getDocs(alertsRef);

    let good = 10;
    let excellent = 5;
    let needAction = 19;

    alertsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.alertType === 'good') {
        good++;
      } else if (data.alertType === 'excellent') {
        excellent++;
      } else if (data.alertType === 'needAction') {
        needAction++;
      }
    });

    return {
      pendingApprovals: { clients, applicants },
      activeUsers: { active, inactive },
      alerts: { good, excellent, needAction }
    };

  } catch (error) {
    console.error("Error fetching data: ", error);
  }
};

// Function to create a Pie Chart
const createPieChart = (chartId, chartData) => {
  const ctx = document.getElementById(chartId).getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
      },
    },
  });
};

// Event listener for DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  fetchData().then(data => {
    // Data for Pie Charts
    const pendingApprovalsData = {
      labels: ["Applicants", "Clients"],
      datasets: [{
        label: 'Pending Approvals',
        data: [data.pendingApprovals.applicants, data.pendingApprovals.clients],
        backgroundColor: ['#227B94', '#CBE2B5'],
      }],
    };

    const activeUsersData = {
      labels: ["Active", "Inactive"],
      datasets: [{
        label: 'Active Users',
        data: [data.activeUsers.active, data.activeUsers.inactive],
        backgroundColor: ['#A1DD70', '#FFA27F'],
      }],
    };

    const alertsData = {
      labels: ["Good", "Excellent", "Need Action"],
      datasets: [{
        label: 'Alerts',
        data: [data.alerts.good, data.alerts.excellent, data.alerts.needAction],
        backgroundColor: ['#387F39', '#A2CA71', '#F6E96B'],
      }],
    };

    // Create Pie Charts
    createPieChart('pendingApprovalsChart', pendingApprovalsData);
    createPieChart('activeUsersChart', activeUsersData);
    createPieChart('alertsChart', alertsData);
  });
});
