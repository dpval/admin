import { db } from "../firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Function to determine status based on expiration date
function determineStatus(expirationDate) {
  const currentDate = new Date();
  const expDate = new Date(expirationDate);
  const timeDiff = expDate - currentDate;
  const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert time difference to days

  if (daysLeft <= 7) {
    return { status: "Needs Action", color: "#FF6347" }; // Red color for immediate action
  } else if (daysLeft <= 30) {
    return { status: "Good", color: "#FFD700" }; // Yellow color for "Good"
  } else if (daysLeft > 30) {
    return { status: "Excellent", color: "#32CD32" }; // Green color for "Excellent"
  } else {
    return { status: "N/A", color: "#D3D3D3" }; // Gray for invalid or missing dates
  }
}

// Function to format Firestore Timestamp to YYYY-MM-DD
function formatDate(timestamp) {
  const date = timestamp.toDate(); // Convert Firestore Timestamp to JS Date object
  return date.toISOString().split("T")[0]; // Format to YYYY-MM-DD
}

// Function to send an email notification when the status is "Needs Action"
async function sendEmailNotification(userData) {
  const subject = "Urgent: Barangay Clearance Update Required";
  const message = `<p>Dear ${userData.display_name},</p>
                   <p>Your Barangay Clearance is about to expire. Please update it as soon as possible to avoid any interruptions.</p>`;

  try {
    await fetch("http://127.0.0.1:8080/send-email", {
      // Adjust the URL based on your server setup
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: userData.email,
        subject: subject,
        message: message,
      }),
    });
    console.log("Email sent successfully to:", userData.email);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Function to update expiration date and status in Firestore
// Function to update expiration date and status in Firestore
async function updateExpirationDate(userId, newExpirationDate) {
  const userDocRef = doc(db, "users", userId); // Reference to the user's document

  try {
    // Convert newExpirationDate to Firestore Timestamp
    const timestamp = Timestamp.fromDate(new Date(newExpirationDate));

    // Fetch the document data
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      console.error("No such document!");
      return;
    }

    // Update the expiration date
    await updateDoc(userDocRef, {
      expiration: timestamp, // Save the new expiration date
    });
    console.log("Expiration date updated successfully");

    // Optionally send email notification if status is "Needs Action"
    const userData = userDoc.data();
    const statusInfo = determineStatus(timestamp.toDate());
    if (statusInfo.status === "Needs Action") {
      await sendEmailNotification(userData);
    }
  } catch (error) {
    console.error("Error updating expiration date:", error);
  }
}

// Main function to fetch and display users with status and send email
// Main function to fetch and display users with status and send email
async function fetchAndDisplayUsers(
  searchTerm = "",
  fromDate = "",
  toDate = "",
  statusFilter = ""
) {
  // Query to fetch only users with 'firsttimestatus' as 'approved'
  let userQuery = query(
    collection(db, "users"),
    orderBy("created_time", "desc")
  );

  // Listen for real-time updates to the query
  onSnapshot(userQuery, (querySnapshot) => {
    const userAlertsTable = document
      .getElementById("userAlerts")
      .querySelector("tbody");
    userAlertsTable.innerHTML = ""; // Clear the table before appending new rows

    querySnapshot.forEach((userDoc) => {
      const user = userDoc.data();

      // Check if firsttimestatus is "approved" and usertype is "client" or "applicant"
      if (
        user.firsttimestatus !== "approved" ||
        (user.usertype !== "client" && user.usertype !== "applicant")
      ) {
        return; // Skip users who don't have firsttimestatus as "approved" or are not clients/applicants
      }

      // Apply Search Filter
      if (
        searchTerm &&
        !(
          user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ) {
        return; // Skip if user doesn't match the search term
      }

      // Apply Date Range Filter
      if (fromDate && user.expiration) {
        const expirationDate = user.expiration
          .toDate()
          .toISOString()
          .split("T")[0];
        if (expirationDate < fromDate) return; // Skip if expiration date is before the fromDate
      }

      if (toDate && user.expiration) {
        const expirationDate = user.expiration
          .toDate()
          .toISOString()
          .split("T")[0];
        if (expirationDate > toDate) return; // Skip if expiration date is after the toDate
      }

      // Apply Status Filter
      if (statusFilter && user.expiration) {
        const statusInfo = determineStatus(user.expiration.toDate());
        if (statusInfo.status !== statusFilter) return; // Skip if status doesn't match
      }

      // Create the table row and populate it with data
      const tr = document.createElement("tr");

      // Name column with photo
      const nameTd = document.createElement("td");

      // Create the image element for the photo
      if (user.photo_url) {
        const img = document.createElement("img");
        img.src = user.photo_url;
        img.alt = "Profile Photo";
        img.style.width = "25px"; // Adjust the size of the image
        img.style.height = "25px"; // Adjust the size of the image
        img.style.borderRadius = "50%"; // Make the image circular
        img.style.marginRight = "10px"; // Add some space between the image and text

        nameTd.appendChild(img); // Append the image to the nameTd
      }

      // Append the name text next to the image
      const nameText = document.createTextNode(
        `${user.display_name || "N/A"} ${user.lastname || "N/A"}`
      );
      nameTd.appendChild(nameText);
      tr.appendChild(nameTd);

      // Barangay Clearance column
      const clearanceTd = document.createElement("td");
      if (user.baranggayClearance) {
        const link = document.createElement("a");
        link.href = user.baranggayClearance;
        link.textContent = "View Document";
        link.target = "_blank";
        clearanceTd.appendChild(link);
      } else {
        clearanceTd.textContent = "N/A";
      }
      tr.appendChild(clearanceTd);

      // Expired on column with input
      const expirationTd = document.createElement("td");
      const expirationInput = document.createElement("input");
      expirationInput.type = "date";

      if (user.expiration) {
        const expDate = user.expiration.toDate().toISOString().substring(0, 10);
        expirationInput.value = expDate; // Prepopulate the input with the current expiration date
      }

      expirationInput.addEventListener("change", async (event) => {
        const newExpirationDate = event.target.value; // Get the new date value from the input
        await updateExpirationDate(userDoc.id, newExpirationDate); // Call the function to update the expiration date
        fetchAndDisplayUsers(); // Refresh the user list to reflect changes
      });

      expirationTd.appendChild(expirationInput);
      tr.appendChild(expirationTd);

      // Status column
      const statusTd = document.createElement("td");
      if (user.expiration) {
        const statusInfo = determineStatus(user.expiration.toDate());
        statusTd.textContent = statusInfo.status;
        statusTd.style.backgroundColor = statusInfo.color;
      } else {
        statusTd.textContent = "N/A";
        statusTd.style.backgroundColor = "#D3D3D3"; // Gray for N/A
      }
      tr.appendChild(statusTd);

      // Append the row to the table
      userAlertsTable.appendChild(tr);
    });
  });
}


// Event Listeners for dynamic search on input
document.getElementById("searchInput").addEventListener("input", () => {
  const searchTerm = document.getElementById("searchInput").value.trim();
  const fromDate = document.getElementById("dateFrom").value;
  const toDate = document.getElementById("dateTo").value;
  const statusFilter = document.getElementById("statusFilter").value;
  fetchAndDisplayUsers(searchTerm, fromDate, toDate, statusFilter);
});

// Event Listeners for Search and Filter Buttons
document.getElementById("searchBtn").addEventListener("click", () => {
  const searchTerm = document.getElementById("searchInput").value.trim();
  const fromDate = document.getElementById("dateFrom").value;
  const toDate = document.getElementById("dateTo").value;
  const statusFilter = document.getElementById("statusFilter").value;
  fetchAndDisplayUsers(searchTerm, fromDate, toDate, statusFilter);
});

// Event Listener for the Refresh Button
document.querySelector(".userTypeBtn").addEventListener("click", () => {
  fetchAndDisplayUsers(); // Fetch all users without filters
});
// Function to export data to PDF
function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const rows = [];

  const userAlertsTable = document
    .getElementById("userAlerts")
    .querySelector("tbody");
  const dataRows = userAlertsTable.querySelectorAll("tr");

  dataRows.forEach((row) => {
    const rowData = [];
    const cells = row.querySelectorAll("td");
    cells.forEach((cell) => {
      rowData.push(cell.textContent);
    });
    rows.push(rowData);
  });

  doc.autoTable({
    head: [["Name", "Barangay Clearance", "Expired On", "Status"]],
    body: rows,
  });

  doc.save("alertsinUsers.pdf");
}

// Function to export data to Excel
function exportToExcel() {
  const userAlertsTable = document.getElementById("userAlerts");
  const wb = XLSX.utils.table_to_book(userAlertsTable);
  XLSX.writeFile(wb, "alertsinUsers.xlsx");
}

// Function to export data to Word
function exportToWord() {
  const userAlertsTable = document.getElementById("userAlerts").outerHTML;
  const blob = new Blob([userAlertsTable], {
    type: "application/vnd.ms-word",
  });
  saveAs(blob, "alertsinUsers.doc");
}

// Event Listeners for Export Buttons
document.getElementById("exportPDF").addEventListener("click", exportToPDF);
document.getElementById("exportExcel").addEventListener("click", exportToExcel);
document.getElementById("exportWord").addEventListener("click", exportToWord);

// Initial fetch and display of users
fetchAndDisplayUsers();
