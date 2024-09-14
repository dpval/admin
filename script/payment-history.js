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

  // Fetch payment history and populate the table
  async function fetchPaymentHistory() {
    try {
      const paymentHistoryQuery = query(
        collection(db, "walletTopUp"),
        orderBy("amount", "desc") // Order by amount in descending order
      );
      const querySnapshot = await getDocs(paymentHistoryQuery);

      allUsersTable.innerHTML = ""; // Clear the table before adding rows

      // Loop through each payment history record
      for (const docSnap of querySnapshot.docs) {
        const paymentData = docSnap.data();
        const userRef = paymentData.userID;
        const {
          amount,
          method,
          nameofAccount,
          numberofAccount,
          typeoftransaction,
          status,
        } = paymentData;

        // Fetch the user document to get the client name
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const clientName = `${userData.display_name} ${userData.lastname}`;

          // Create table row
          const tr = document.createElement("tr");

          // Client Name
          const clientNameTd = document.createElement("td");
          clientNameTd.textContent = clientName;
          tr.appendChild(clientNameTd);

          // Amount
          const amountTd = document.createElement("td");
          amountTd.textContent = amount;
          tr.appendChild(amountTd);

          // Method
          const methodTd = document.createElement("td");
          methodTd.textContent = method;
          tr.appendChild(methodTd);

          // Account Name
          const nameofAccountTd = document.createElement("td");
          nameofAccountTd.textContent = nameofAccount;
          tr.appendChild(nameofAccountTd);

          // Account Number
          const numberofAccountTd = document.createElement("td");
          numberofAccountTd.textContent = numberofAccount;
          tr.appendChild(numberofAccountTd);

          // Transaction Type
          const typeoftransactionTd = document.createElement("td");
          typeoftransactionTd.textContent = typeoftransaction;
          tr.appendChild(typeoftransactionTd);

          // Status
          const statusTd = document.createElement("td");
          statusTd.textContent = status;
          tr.appendChild(statusTd);

          allUsersTable.appendChild(tr);
        } else {
          console.error("No user found for reference: ", userRef.id);
        }
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
    }
  }

  // Initial load of payment history
  fetchPaymentHistory();
});
