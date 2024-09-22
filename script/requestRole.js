import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Function to fetch all requests for role change
async function fetchRequestChanges() {
  const requestChangesRef = collection(db, "requestChange");
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
      const daysCount = Math.floor(
        (currentDate - requestDate) / (1000 * 60 * 60 * 24)
      );

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
          usertype:
            userData.usertype === "applicant"
              ? "Gig Worker"
              : userData.usertype, // Display as Gig Worker if applicant
        },
        userRef: userRef, // Keep a reference for later updates
        revertDate: new Date(
          requestData.currentTime.seconds * 1000 + 20 * 24 * 60 * 60 * 1000
        ), // Calculate the revert date
      });
    }
  }

  displayRequests(requests);
}

// Function to display the requests in the table
function displayRequests(requests) {
  const tableBody = document.querySelector("#requestroles tbody");
  tableBody.innerHTML = ""; // Clear the table body before appending new data

  requests.forEach((request) => {
    const row = document.createElement("tr");

    // Formatting usertype and requestRole
    const userTypeText = request.user.usertype === "applicant" ? "Gig Worker" : request.user.usertype;
    const requestRoleText = request.requestRole === "applicant" ? "Gig Worker" : request.requestRole;

    // Formatting date
    const formattedDate = new Date(request.currentTime.seconds * 1000).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
      timeZoneName: "short",
    });

    // Calculating days left for reverting
    const now = new Date();
    let daysLeft = "";
    let roleBackPrediction = "";

    if (request.status === "Approved") {
      const daysRemaining = Math.ceil((request.revertDate - now) / (1000 * 60 * 60 * 24));
      daysLeft = `${daysRemaining} days left`;
      roleBackPrediction = request.revertDate.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } else {
      daysLeft = request.daysCount;
    }

    // Action buttons for approve and disapprove if status is pending
    let actionButtons = "";
    if (request.status === "Pending") {
      actionButtons = `
        <button onclick="approveRequest('${request.id}', '${request.userRef.path}', '${request.requestRole}', '${request.originalUsertype}')">Approve</button>
        <button onclick="disapproveRequest('${request.id}')">Disapprove</button>
      `;
    } else if (request.status === "Approved") {
      actionButtons = `Approved - Reverting in ${daysLeft}`;
    } else {
      actionButtons = "Disapproved";
    }

    row.innerHTML = `
      <td>${request.user.display_name} ${request.user.lastname}</td>
      <td>${request.reason}</td>
      <td>${userTypeText}</td>
      <td>${requestRoleText}</td>
      <td>${formattedDate}</td>
      <td>${request.status}</td>
      <td>${daysLeft}</td>
      <td>${roleBackPrediction}</td>
      <td>${actionButtons}</td>
    `;

    tableBody.appendChild(row);
  });

  // Pass requests to add export buttons
  addExportButtons(requests);
}


// Function to send email
function sendEmail(toEmail, subject, body) {
  fetch("http://localhost:3000/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: toEmail,
      subject: subject,
      message: body,
    }),
  })
    .then((response) => response.text())
    .then((data) => {
      console.log("Email sent:", data);
    })
    .catch((error) => {
      console.error("Error sending email:", error);
    });
}

// Function to approve the request and change usertype
async function approveRequest(
  requestId,
  userRefPath,
  newUsertype,
  originalUsertype
) {
  const userRef = doc(db, userRefPath);

  // Determine the new usertype based on the requestRole
  const updatedUsertype = newUsertype === "applicant" ? "client" : "applicant"; // Change to 'Client' or 'Applicant'

  // Update the user's usertype in the users collection
  await updateDoc(userRef, { usertype: updatedUsertype });

  // Update the request status to 'Approved' and save the original usertype in the requestChange collection
  const requestRef = doc(db, "requestChange", requestId);
  await updateDoc(requestRef, {
    status: "Approved",
    originalUsertype: originalUsertype,
    currentTime: Timestamp.now(), // Reset the time to start the 20-day countdown
  });

  // Fetch user data for email notification
  const userSnapshot = await getDoc(userRef);
  const userData = userSnapshot.data();
  const userEmail = userData.email;

  // Send email notification
  sendEmail(
    userEmail,
    "Request Approved",
    `Your request to change your role to ${updatedUsertype} has been approved.`
  );

  // Reload the page to reflect the updated status
  fetchRequestChanges();

  // Start the 20-day timer to revert the usertype
  setTimeout(async () => {
    await revertUsertype(userRefPath, originalUsertype, requestId);
  }, 20 * 24 * 60 * 60 * 1000); // 20 days in milliseconds
}

// Function to revert the usertype after 20 days
async function revertUsertype(userRefPath, originalUsertype, requestId) {
  const userRef = doc(db, userRefPath);

  // Revert the user's usertype to the original one
  await updateDoc(userRef, { usertype: originalUsertype });

  // Update the requestChange document to indicate the reversion
  const requestRef = doc(db, "requestChange", requestId);
  await updateDoc(requestRef, {
    status: "Reverted",
  });

  // Reload the table to reflect changes
  fetchRequestChanges();
}

// Function to disapprove the request
async function disapproveRequest(requestId) {
  const requestRef = doc(db, "requestChange", requestId);
  await updateDoc(requestRef, {
    status: "Disapproved",
  });

  // Fetch user data for email notification
  const requestData = (await getDoc(requestRef)).data();
  const userRef = doc(db, requestData.userRef.path);
  const userSnapshot = await getDoc(userRef);
  const userData = userSnapshot.data();
  const userEmail = userData.email;

  // Send email notification
  sendEmail(
    userEmail,
    "Request Disapproved",
    "Your request to change your role has been disapproved."
  );

  // Reload the page to reflect the updated status
  fetchRequestChanges();
}
// Function to export requests to PDF
async function exportToPDF(requests) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Set up the document content
  let content = "Role Change Requests\n\n";
  requests.forEach(request => {
    content += `User: ${request.user.display_name} ${request.user.lastname}\n`;
    content += `Reason: ${request.reason}\n`;
    content += `Requested Role: ${request.requestRole}\n`;
    content += `Status: ${request.status}\n`;
    content += `Date: ${new Date(request.currentTime.seconds * 1000).toLocaleString()}\n`;
    content += "--------------------------\n";
  });

  doc.text(content, 10, 10);
  doc.save('role_change_requests.pdf');
}

// Function to export requests to Excel
async function exportToExcel(requests) {
  const worksheet = XLSX.utils.json_to_sheet(requests.map(request => ({
    User: `${request.user.display_name} ${request.user.lastname}`,
    Reason: request.reason,
    RequestedRole: request.requestRole,
    Status: request.status,
    Date: new Date(request.currentTime.seconds * 1000).toLocaleString(),
  })));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Requests');
  XLSX.writeFile(workbook, 'role_change_requests.xlsx');
}

// Function to export requests to Word (as an HTML file)
async function exportToWord(requests) {
  let content = `<h1>Role Change Requests</h1>`;
  requests.forEach(request => {
    content += `<h2>User: ${request.user.display_name} ${request.user.lastname}</h2>`;
    content += `<p>Reason: ${request.reason}</p>`;
    content += `<p>Requested Role: ${request.requestRole}</p>`;
    content += `<p>Status: ${request.status}</p>`;
    content += `<p>Date: ${new Date(request.currentTime.seconds * 1000).toLocaleString()}</p>`;
    content += `<hr>`;
  });

  const blob = new Blob([content], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'role_change_requests.doc';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Add buttons for exporting
// Add buttons for exporting
function addExportButtons(requests) {
  const exportDiv = document.createElement('div');
  exportDiv.innerHTML = `
    <button id="exportPDF">Export to PDF</button>
    <button id="exportExcel">Export to Excel</button>
    <button id="exportWord">Export to Word</button>
  `;
  document.body.appendChild(exportDiv);

  // Attach event listeners to the buttons
  document.getElementById('exportPDF').onclick = () => exportToPDF(requests);
  document.getElementById('exportExcel').onclick = () => exportToExcel(requests);
  document.getElementById('exportWord').onclick = () => exportToWord(requests);
}

// Attach functions to the window object
window.approveRequest = approveRequest;
window.disapproveRequest = disapproveRequest;
// Load request changes on page load
window.onload = fetchRequestChanges;
