// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOC-a_k4IEpdeW_Rms6v_V8jBgdTO2k5M",
  authDomain: "tradeare-us-2nx4zp.firebaseapp.com",
  projectId: "tradeare-us-2nx4zp",
  storageBucket: "tradeare-us-2nx4zp.appspot.com",
  messagingSenderId: "752862844692",
  appId: "1:752862844692:web:5d656e58696c44d5ef9401",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Define time constants
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

// Fetch data function
const fetchData = async () => {
  try {
    const usersRef = collection(db, "users");

    // Fetch pending approvals with specific firsttimestatus
    const pendingQuery = query(
      usersRef,
      where("firsttimestatus", "==", "pending"),
      where("usertype", "in", ["client", "applicant"])
    );
    const pendingSnapshot = await getDocs(pendingQuery);

    let clients = 0;
    let applicants = 0;

    pendingSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.usertype === "client") {
        clients++;
      } else if (data.usertype === "applicant") {
        applicants++;
      }
    });

    // Fetch active users based on last login time
    const activeQuery = query(
      usersRef,
      where("firsttimestatus", "==", "approved")
    );
    const activeSnapshot = await getDocs(activeQuery);

    let active = 0;
    let inactive = 0;
    const currentTime = new Date().getTime();

    activeSnapshot.forEach((doc) => {
      const data = doc.data();
      const { isLogin } = data;

      // Determine status based on last login
      if (isLogin instanceof Timestamp) {
        const lastLogin = isLogin.toMillis();

        // Check if the user logged in within the last 24 hours
        if (currentTime - lastLogin <= ONE_DAY_IN_MS) {
          active++; // User is active
        } else {
          inactive++; // User is inactive
        }
      } else {
        inactive++; // If no last login, consider them inactive
      }
    });

    console.log("Active Users: ", active);
    console.log("Inactive Users: ", inactive);

    // Calculate alert statuses based on expiration for clients and applicants with approved status
    let good = 0;
    let excellent = 0;
    let needAction = 0;

    // Fetch only clients and applicants with approved status
    const alertQuery = query(
      usersRef,
      where("firsttimestatus", "==", "approved"),
      where("usertype", "in", ["client", "applicant"])
    );
    const alertsSnapshot = await getDocs(alertQuery);

    alertsSnapshot.forEach((doc) => {
      const data = doc.data();
      const expiration = data.expiration; // Assuming this is a timestamp

      if (expiration instanceof Timestamp) {
        const expirationTime = expiration.toMillis();
        const daysLeft = Math.ceil(
          (expirationTime - currentTime) / (1000 * 60 * 60 * 24)
        ); // Convert milliseconds to days

        if (daysLeft <= 7) {
          needAction++; // Needs Action
        } else if (daysLeft <= 30) {
          good++; // Good
        } else if (daysLeft > 30) {
          excellent++; // Excellent
        }
      }
    });

    return {
      pendingApprovals: { clients, applicants },
      activeUsers: { active, inactive },
      alerts: { good, excellent, needAction },
    };
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
};

// Listen to recent applications
function listenToRecentApplications() {
  const q = query(
    collection(db, "users"),
    where("firsttimestatus", "==", "pending"),
    orderBy("created_time", "desc")
  );
  onSnapshot(
    q,
    (snapshot) => {
      recentApplications.innerHTML = "";

      let count = 0; // Counter to limit to 3 rows

      snapshot.forEach((doc) => {
        if (count < 3) {
          // Limit to 3 entries
          const user = doc.data();
          const { display_name, lastname, usertype, email, firsttimestatus } =
            user;

          // Create table row
          const tr = document.createElement("tr");

          // Create table cells
          const nameTd = document.createElement("td");
          nameTd.textContent = `${display_name} ${lastname}`;

          const usertypeTd = document.createElement("td");
          usertypeTd.textContent = usertype;

          const emailTd = document.createElement("td");
          emailTd.textContent = email;

          const statusTd = document.createElement("td");
          statusTd.classList.add("warning");
          statusTd.textContent = firsttimestatus;

          const actionTd = document.createElement("td");
          actionTd.classList.add("primary");
          actionTd.textContent = "Details";

          // Append cells to row
          tr.appendChild(nameTd);
          tr.appendChild(usertypeTd);
          tr.appendChild(emailTd);
          tr.appendChild(statusTd);
          tr.appendChild(actionTd);

          // Append row to table body
          recentApplications.appendChild(tr);

          // Add event listener for the "Details" button
          actionTd.addEventListener("click", () => {
            showModal(doc.id, user);
          });

          count++; // Increment counter
        }
      });
    },
    (error) => {
      console.error("Error fetching recent applications: ", error);
    }
  );
}

// Function to create a Pie Chart
const createPieChart = (chartId, chartData) => {
  const ctx = document.getElementById(chartId).getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
      },
    },
  });
};

// DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", () => {
  // Fetch and process data
  fetchData().then((data) => {
    // Data for Pie Charts
    const pendingApprovalsData = {
      labels: ["Applicants", "Clients"],
      datasets: [
        {
          label: "Pending Approvals",
          data: [
            data.pendingApprovals.applicants,
            data.pendingApprovals.clients,
          ],
          backgroundColor: ["#227B94", "#CBE2B5"],
        },
      ],
    };

    const activeUsersData = {
      labels: ["Active", "Inactive"],
      datasets: [
        {
          label: "Active Users",
          data: [data.activeUsers.active, data.activeUsers.inactive],
          backgroundColor: ["#A1DD70", "#FFA27F"],
        },
      ],
    };

    const alertsData = {
      labels: ["Good", "Excellent", "Need Action"],
      datasets: [
        {
          label: "Alerts",
          data: [
            data.alerts.good,
            data.alerts.excellent,
            data.alerts.needAction,
          ],
          backgroundColor: ["#387F39", "#A2CA71", "#F6E96B"],
        },
      ],
    };

    // Create Pie Charts
    createPieChart("pendingApprovalsChart", pendingApprovalsData);
    createPieChart("activeUsersChart", activeUsersData);
    createPieChart("alertsChart", alertsData);
    listenToRecentApplications();
  });
});
