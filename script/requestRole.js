import { db } from "../firebase.js";
import { collection, getDocs, doc, getDoc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Function to fetch all requests for role change
async function fetchRequestChanges() {
  const requestChangesRef = collection(db, 'requestChange');
  const querySnapshot = await getDocs(requestChangesRef);

  const requests = [];

  for (const docSnapshot of querySnapshot.docs) {
    const requestData = docSnapshot.data();

    // Fetch user data from the user reference
    const userRef = doc(db, requestData.userRef.path);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();

      // Calculate the number of days since the request was made or approved
      const requestDate = new Date(requestData.currentTime.seconds * 1000);
      const currentDate = new Date();
      const daysCount = Math.floor((currentDate - requestDate) / (1000 * 60 * 60 * 24));

      requests.push({
        id: docSnapshot.id,
        reason: requestData.reason,
        requestRole: requestData.usertype,
        currentTime: requestData.currentTime,
        status: requestData.status,
        daysCount: daysCount,
        originalUsertype: requestData.originalUsertype || userData.usertype,
        user: {
          display_name: userData.display_name,
          lastname: userData.lastname,
          usertype: userData.usertype === 'applicant' ? 'Gig Worker' : userData.usertype, // Display as Gig Worker if applicant
        },
        userRef: userRef,  // Keep a reference for later updates
        revertDate: new Date(requestData.currentTime.seconds * 1000 + 20 * 24 * 60 * 60 * 1000), // Calculate the revert date
      });
    }
  }

  displayRequests(requests);
}

// Function to display the requests in the table
function displayRequests(requests) {
    const tableBody = document.querySelector('#requestroles tbody');
    tableBody.innerHTML = ''; // Clear the table body before appending new data
  
    requests.forEach((request) => {
      const row = document.createElement('tr');
  
      // Format the usertype based on conditions
      const userTypeText = request.user.usertype === 'applicant' ? 'Gig Worker' : request.user.usertype;
      const requestRoleText = request.requestRole === 'applicant' ? 'Gig Worker' : request.requestRole;
  
      // Format the date to "September 17, 2024 at 12:02:05 AM UTC+8"
      const formattedDate = new Date(request.currentTime.seconds * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
        timeZoneName: 'short',  // This includes the timezone info
      });
  
      // Calculate days left for reverting
      const now = new Date();
      let daysLeft = '';
      let roleBackPrediction = '';
  
      if (request.status === 'Approved') {
        const daysRemaining = Math.ceil((request.revertDate - now) / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.ceil((request.revertDate - now) / (1000 * 60 * 60) % 24);
        const minutesRemaining = Math.ceil((request.revertDate - now) / (1000 * 60) % 60);
        const secondsRemaining = Math.ceil((request.revertDate - now) / 1000 % 60);
  
        daysLeft = `${daysRemaining} days ${hoursRemaining} hours ${minutesRemaining} minutes ${secondsRemaining} seconds left`;
  
        // Calculate role-back prediction date
        roleBackPrediction = request.revertDate.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: true,
          timeZoneName: 'short',
        });
      } else {
        daysLeft = request.daysCount;
      }
  
      // Action buttons for approve and disapprove if status is pending
      let actionButtons = '';
      if (request.status === 'Pending') {
        actionButtons = `
          <button onclick="approveRequest('${request.id}', '${request.userRef.path}', '${request.requestRole}', '${request.originalUsertype}')">Approve</button>
          <button onclick="disapproveRequest('${request.id}')">Disapprove</button>
        `;
      } else if (request.status === 'Approved') {
        actionButtons = `Approved - Reverting in ${daysLeft}`;
      } else {
        actionButtons = 'Disapproved';
      }
  
      row.innerHTML = `
        <td>${request.user.display_name} ${request.user.lastname}</td>
        <td>${request.reason}</td>
        <td>${userTypeText}</td>
        <td>${requestRoleText}</td>
        <td>${formattedDate}</td>
        <td>${request.status}</td>
        <td>${daysLeft}</td>
        <td>${roleBackPrediction}</td> <!-- New column for role back -->
        <td>${actionButtons}</td>
      `;
  
      tableBody.appendChild(row);
    });
  }
  

// Function to approve the request and change usertype
async function approveRequest(requestId, userRefPath, newUsertype, originalUsertype) {
  const userRef = doc(db, userRefPath);

  // Determine the new usertype based on the requestRole
  const updatedUsertype = newUsertype === 'applicant' ? 'client' : 'applicant';  // Change to 'Client' or 'Applicant'

  // Update the user's usertype in the users collection
  await updateDoc(userRef, { usertype: updatedUsertype });

  // Update the request status to 'Approved' and save the original usertype in the requestChange collection
  const requestRef = doc(db, 'requestChange', requestId);
  await updateDoc(requestRef, {
    status: 'Approved',
    originalUsertype: originalUsertype,
    currentTime: Timestamp.now(),  // Reset the time to start the 20-day countdown
  });

  // Reload the page to reflect the updated status
  fetchRequestChanges();
  
  // Start the 20-day timer to revert the usertype
  setTimeout(async () => {
    await revertUsertype(userRefPath, originalUsertype, requestId);
  }, 20 * 24 * 60 * 60 * 1000);  // 20 days in milliseconds
}

// Function to revert the usertype after 20 days
async function revertUsertype(userRefPath, originalUsertype, requestId) {
  const userRef = doc(db, userRefPath);

  // Revert the user's usertype to the original one
  await updateDoc(userRef, { usertype: originalUsertype });

  // Update the requestChange document to indicate the reversion
  const requestRef = doc(db, 'requestChange', requestId);
  await updateDoc(requestRef, {
    status: 'Reverted',
  });

  // Reload the table to reflect changes
  fetchRequestChanges();
}

// Function to disapprove the request
async function disapproveRequest(requestId) {
  const requestRef = doc(db, 'requestChange', requestId);
  await updateDoc(requestRef, {
    status: 'Disapproved',
  });

  // Reload the page to reflect the updated status
  fetchRequestChanges();
}

// Function to periodically refresh the countdown
function updateCountdown() {
    const now = new Date();
    const rows = document.querySelectorAll('#requestroles tbody tr');
  
    rows.forEach((row) => {
      const daysCell = row.cells[6]; // "Days Count" column
      const roleBackCell = row.cells[7]; // "Role Back" column
      const daysLeftText = daysCell.textContent;
  
      if (daysLeftText.includes('days left')) {
        // Calculate remaining time
        const revertDate = new Date(roleBackCell.textContent);
        const timeDifference = revertDate - now;
  
        if (timeDifference > 0) {
          const daysRemaining = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
          const hoursRemaining = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutesRemaining = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
          const secondsRemaining = Math.floor((timeDifference % (1000 * 60)) / 1000);
  
          daysCell.textContent = `${daysRemaining} days ${hoursRemaining} hours ${minutesRemaining} minutes ${secondsRemaining} seconds left`;
        } else {
          daysCell.textContent = 'Reverted';
        }
      }
    });
  }
  

// Attach functions to the global window object
window.approveRequest = approveRequest;
window.disapproveRequest = disapproveRequest;

// Function to initialize the script
function init() {
  fetchRequestChanges();
  // Set up a timer to update the countdown every day
  setInterval(updateCountdown, 24 * 60 * 60 * 1000); // 24 hours
}

// Initialize the script when the page loads
window.onload = init;
