import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

async function fetchEmergencyData() {
  try {
    // Reference to the 'emergency' collection
    const emergencyCollection = collection(db, "emergency");

    // Create a query to order data by date (optional)
    const emergencyQuery = query(emergencyCollection, orderBy("date", "desc"));

    // Fetch documents from the collection
    const querySnapshot = await getDocs(emergencyQuery);

    // Get the table body element
    const tableBody = document.getElementById("allUsers");

    // Iterate through each document in the snapshot
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Create a new row for each document
      const row = document.createElement("tr");

      // Add cells for each field
      row.innerHTML = `
  <td>${data.name} ${data.lastname}</td> <!-- Combine name and lastname -->
  <td>${data.contactnumber}</td>
  <td>${data.email}</td>
  <td>${data.date
    .toDate()
    .toLocaleString()}</td> <!-- Convert Firestore timestamp -->
  <td>${data.emergencymessage}</td>
  <td>${data.emergencytype}</td>
  <td>${data.status}</td>
`;

      // Append the row to the table body
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching emergency data:", error);
  }
}

// Call the function to fetch and display data
fetchEmergencyData();
