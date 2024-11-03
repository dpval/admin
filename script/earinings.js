import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const allUsersTable = document.getElementById("allUsers");
  const totalEarningsHeader = document.querySelector("h2#totalEarnings");
  const earningsDayHeader = document.getElementById("earningsDay");
  const noEarningsParagraph = document.getElementById("noEarnings");

  let totalEarnings = 0;

  // Get the current date
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0)); // Start of the day
  const todayEnd = new Date(today.setHours(23, 59, 59, 999)); // End of the day

  // Format the current date to display
  const options = { year: "numeric", month: "long", day: "numeric" };
  earningsDayHeader.textContent = `Earnings for this Day: ${new Date().toLocaleDateString(
    undefined,
    options
  )}`;

  // Fetch earnings history and populate the table for the current day
 // Fetch earnings history and populate the table for the current day
// Fetch earnings history and populate the table for the current day
// Fetch earnings history and populate the table for the current day
async function fetchEarningsHistory() {
  try {
    const walletTopUpQuery = query(
      collection(db, "walletTopUp"),
      where("status", "==", "approved"),
      where("currentTime", ">=", todayStart),
      where("currentTime", "<=", todayEnd),
      orderBy("currentTime", "desc")
    );
    const walletTopUpSnapshot = await getDocs(walletTopUpQuery);

    allUsersTable.innerHTML = ""; // Clear the table before adding rows

    if (walletTopUpSnapshot.docs.length === 0) {
      noEarningsParagraph.style.display = "block";
      totalEarningsHeader.textContent = "Total Earnings for Today: 0.00";
      return;
    }

    noEarningsParagraph.style.display = "none"; // Hide 'no earnings' if there are results

    // Loop through each approved transaction
    for (const docSnap of walletTopUpSnapshot.docs) {
      const transactionData = docSnap.data();

      // Check if userID is a DocumentReference and get its ID
      let userID;
      if (transactionData.userID instanceof Object && transactionData.userID.id) {
        userID = transactionData.userID.id; // Extract document ID from DocumentReference
      } else {
        console.error("Invalid userID:", transactionData.userID);
        continue; // Skip this iteration if userID is not valid
      }

      const userRef = doc(db, "users", userID);
      const { amount,token,earnings, method, typeoftransaction } = transactionData;

      // // Calculate the earnings based on the method
      // let earnings;
      // if (method === "E-Wallet") {
      //   earnings = amount; // 100% deduction for E-Wallet
      // } else {
      //   earnings = amount * 0.05; // 5% deduction for other methods
      // }

      // Fetch the user document to get the client name
      const userDoc = await getDoc(userRef);
      let clientName = "Unknown"; // Default value if user not found

      if (userDoc.exists()) {
        const userData = userDoc.data();
        clientName = `${userData.display_name} ${userData.lastname}`;
      }

      // Add the earnings to the total earnings
      totalEarnings += earnings;

      // Create table row
      const tr = document.createElement("tr");

      // Client Name
      const clientNameTd = document.createElement("td");
      clientNameTd.textContent = clientName;
      tr.appendChild(clientNameTd);

      // Amount
      const amountTd = document.createElement("td");
      amountTd.textContent = amount.toFixed(2);
      tr.appendChild(amountTd);
      // Amount
      const tokenTd = document.createElement("td");
      tokenTd.textContent = token;
      tr.appendChild(tokenTd);
      // Amount
      const earningsTd = document.createElement("td");
      earningsTd.textContent = earnings;
      tr.appendChild(earningsTd);

      // Method
      const methodTd = document.createElement("td");
      methodTd.textContent = method;
      tr.appendChild(methodTd);
      // Transaction Type
      const transactionTypeTd = document.createElement("td");
      transactionTypeTd.textContent = typeoftransaction;
      tr.appendChild(transactionTypeTd);

      allUsersTable.appendChild(tr);
    }

    // Display the total earnings for today
    totalEarningsHeader.textContent = `Total Earnings for Today: ${totalEarnings.toFixed(
      2
    )}`;
  } catch (error) {
    console.error("Error fetching earnings history:", error);
  }
}



  // Initial load of earnings history
  fetchEarningsHistory();
});

