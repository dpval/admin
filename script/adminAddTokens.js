import { db } from "../firebase.js"; // Import `db` from firebase.js
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Getting references to input and button elements
const addInput = document.getElementById("addInput");
const addButton = document.querySelector("button");
const totalApplicantsElement = document.getElementById("totalApplicants");
const recentApplicationsElement = document.getElementById("recentApplications");

// Fetch current TAUkens and display them
async function fetchCurrentTaukens() {
  try {
    const adminDocRef = doc(db, "admin_CashFunds", "V1eVx88jTZdaaHru6zRK");
    const adminDocSnapshot = await getDoc(adminDocRef);

    if (adminDocSnapshot.exists()) {
      const adminData = adminDocSnapshot.data();
      const currentTaukens = adminData.adminTAUkens;
      totalApplicantsElement.textContent = currentTaukens;
    } else {
      console.error("Admin document not found.");
    }
  } catch (error) {
    console.error("Error fetching TAUkens:", error);
  }
}

// Add TAUkens and update history
addButton.addEventListener("click", async () => {
  const addedTaukens = parseInt(addInput.value, 10);

  // Check if input is a valid number
  if (!isNaN(addedTaukens) && addedTaukens > 0) {
    try {
      const adminDocRef = doc(db, "admin_CashFunds", "V1eVx88jTZdaaHru6zRK");

      // Retrieve current values of adminCash and adminTAUkens
      const adminDocSnapshot = await getDoc(adminDocRef);
      if (adminDocSnapshot.exists()) {
        const adminData = adminDocSnapshot.data();
        const updatedCash = adminData.adminCash + addedTaukens;
        const updatedTaukens = adminData.adminTAUkens + addedTaukens;

        // Update the adminCash and adminTAUkens fields in Firestore
        await updateDoc(adminDocRef, {
          adminCash: updatedCash,
          adminTAUkens: updatedTaukens,
        });

        // Add to history collection
        const historyRef = collection(
          db,
          "admin_CashFunds",
          "V1eVx88jTZdaaHru6zRK",
          "history"
        );
        await addDoc(historyRef, {
          taukensAdded: addedTaukens,
          addedBy: "admin", // Since admin is static
          timestamp: Timestamp.now(),
        });

        // Update UI to reflect new values
        totalApplicantsElement.textContent = updatedTaukens;
        addInput.value = ""; // Clear input field after successful addition

        // Refresh the history table
        fetchHistory();

        console.log("TAUkens and Cash updated successfully.");
      } else {
        console.error("No admin document found.");
      }
    } catch (error) {
      console.error("Error updating TAUkens and Cash:", error);
    }
  } else {
    alert("Please enter a valid positive number.");
  }
});

// Fetch and display TAUkens addition history
async function fetchHistory() {
  try {
    const historyQuery = query(
      collection(db, "admin_CashFunds", "V1eVx88jTZdaaHru6zRK", "history"),
      orderBy("timestamp", "desc")
    );
    const historySnapshot = await getDocs(historyQuery);
    recentApplicationsElement.innerHTML = ""; // Clear current history

    historySnapshot.forEach((doc) => {
      const historyData = doc.data();
      const row = `
        <tr>
          <td>${historyData.timestamp.toDate().toLocaleString()}</td>
          <td>${historyData.taukensAdded}</td>
          <td>${historyData.addedBy}</td>
        </tr>
      `;
      recentApplicationsElement.insertAdjacentHTML("beforeend", row);
    });
  } catch (error) {
    console.error("Error fetching history:", error);
  }
}

// Initial fetching of TAUkens and history on page load
window.addEventListener("DOMContentLoaded", () => {
  fetchCurrentTaukens();
  fetchHistory();
});
