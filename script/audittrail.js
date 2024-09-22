import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Function to fetch audit trail data and corresponding user data
async function fetchAuditTrailData() {
  const recentTrailsElement = document.getElementById('recenttrails');
  recentTrailsElement.innerHTML = ''; // Clear previous data

  // Fetch data from the /auditTrail collection
  const auditTrailRef = collection(db, 'auditTrail');
  const snapshot = await getDocs(auditTrailRef);

  snapshot.forEach(async (auditDoc) => {
    const auditData = auditDoc.data();
    const userRef = auditData.userid; // This is a DocumentReference

    // Check if userRef is defined
    if (!userRef) {
      console.error('User reference is undefined for audit document:', auditDoc.id);
      return; // Skip this iteration if userRef is not defined
    }

    // Fetch corresponding user data from /users collection using userID
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const displayName = userData.display_name;
      const lastName = userData.lastname;
      const userType = userData.usertype;
      const action = auditData.typeofTrail;

      // Format the time as "September 23, 2024 at 12:35:00 AM"
      const time = new Date(auditData.currentTime.toDate());
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      const formattedTime = time.toLocaleString('en-US', options).replace(',', ' at');

      // Append the data to the table
      const newRow = `
        <tr>
          <td>${displayName} ${lastName}</td>
          <td>${userType}</td>
          <td>${action}</td>
          <td>${formattedTime}</td>
        </tr>
      `;
      recentTrailsElement.innerHTML += newRow;
    } else {
      console.error('User document does not exist for user reference:', userRef.path);
    }
  });
}

// Call the function to load the data when the page loads
window.onload = fetchAuditTrailData;
