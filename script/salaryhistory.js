import { db } from "../firebase.js"; 
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  query,
  where,
  increment,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const allUsersTable = document.getElementById("allUsers");
  const adminTAUkensDisplay = document.getElementById("adminTAUkens"); // Element to display admin TAUkens

  // Function to fetch and display admin TAUkens
  async function fetchAdminTAUkens() {
      const docRef = doc(db, "admin_CashFunds", "V1eVx88jTZdaaHru6zRK"); // Replace with the actual document ID
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
          const adminTAUkensValue = docSnap.data().adminTAUkens; // Replace with the actual field name
          document.getElementById("adminTAUkensValue").innerText = `Current Admin TAUkens: ${adminTAUkensValue}`;
      } else {
          document.getElementById("adminTAUkensValue").innerText = "No data available.";
      }
  }

  // Function to fetch and display wallet notifications with filter
  async function fetchWalletNotifications() {
      const notificationsRef = collection(db, "admin_WalletNotification");
      const filteredQuery = query(notificationsRef, where("typeofTransaction", "==", "Pay for Post Task"));
      const snapshot = await getDocs(filteredQuery);
      
      // Clear any existing rows
      allUsersTable.innerHTML = "";

      // Check if there are documents in the collection
      if (snapshot.empty) {
          allUsersTable.innerHTML = "<tr><td colspan='4'>No notifications available.</td></tr>";
          return;
      }

      // Loop through each document in the snapshot
      snapshot.forEach(doc => {
          const data = doc.data();
          
          // Create a new row for each document
          const row = document.createElement("tr");
          
          // Format the currentTime
          const formattedDate = formatDate(data.currentTime); // Assuming currentTime is a Firestore Timestamp
          
          row.innerHTML = `
              <td>${data.amount}</td> <!-- Ensure these match your Firestore field names -->
              <td>${formattedDate}</td> <!-- Display formatted date -->
              <td>${data.type}</td>
              <td>${data.typeofTransaction}</td>
          `;
          allUsersTable.appendChild(row); // Append the row to the table body
      });
  }

  // Helper function to format Firestore Timestamp to desired format
  function formatDate(timestamp) {
      const date = new Date(timestamp.seconds * 1000); // Convert Firestore Timestamp to JavaScript Date
      return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: true,
      }).replace(',', ' at'); // Format to "September 18, 2024 at 5:01:03 PM"
  }

  // Fetch both admin TAUkens and wallet notifications on page load
  await fetchAdminTAUkens();
  await fetchWalletNotifications();
});
