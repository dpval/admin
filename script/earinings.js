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

  let totalEarnings = 0; // Variable to track total earnings

  // Fetch earnings history and populate the table
  async function fetchEarningsHistory() {
    try {
      const walletTopUpQuery = query(
        collection(db, "walletTopUp"),
        where("status", "==", "approved"), // Filter by approved status
        orderBy("amount", "desc") // Order by amount in descending order
      );
      const walletTopUpSnapshot = await getDocs(walletTopUpQuery);

      allUsersTable.innerHTML = ""; // Clear the table before adding rows

      // Loop through each approved transaction in walletTopUp
      for (const docSnap of walletTopUpSnapshot.docs) {
        const transactionData = docSnap.data();
        const userRef = transactionData.userID;
        const { amount, method, typeoftransaction } = transactionData;

        // Calculate the 5% earnings deduction
        const earnings = amount * 0.05;

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

        // Method
        const methodTd = document.createElement("td");
        methodTd.textContent = method;
        tr.appendChild(methodTd);

        // Earnings (5% of amount)
        const earningsTd = document.createElement("td");
        earningsTd.textContent = earnings.toFixed(2); // Display earnings with 2 decimal places
        tr.appendChild(earningsTd);

        // Transaction Type
        const transactionTypeTd = document.createElement("td");
        transactionTypeTd.textContent = typeoftransaction;
        tr.appendChild(transactionTypeTd);

        allUsersTable.appendChild(tr);
      }

      // Display the total earnings
      totalEarningsHeader.textContent = `Total Earnings: ${totalEarnings.toFixed(2)}`;
    } catch (error) {
      console.error("Error fetching earnings history:", error);
    }
  }

  // Initial load of earnings history
  fetchEarningsHistory();
});
