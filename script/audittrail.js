import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

let auditDataArray = []; // Store audit data for pagination
let currentPage = 0; // Track current page
const rowsPerPage = 6; // Number of rows to display per page

async function fetchAuditTrailData() {
  const auditTrailRef = collection(db, 'auditTrail');
  const snapshot = await getDocs(auditTrailRef);

  const promises = snapshot.docs.map(async (auditDoc) => {
    const auditData = auditDoc.data();
    const userRef = auditData.userid; // This is a DocumentReference

    if (!userRef) {
      console.error('User reference is undefined for audit document:', auditDoc.id);
      return null;
    }

    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const displayName = `${userData.display_name} ${userData.lastname}`;
      const userType = userData.usertype;
      const action = auditData.typeofTrail;

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

      return { displayName, userType, action, formattedTime, transactionDate: time }; // Include raw date for filtering
    } else {
      console.error('User document does not exist for user reference:', userRef.path);
      return null;
    }
  });

  auditDataArray = await Promise.all(promises);
  auditDataArray = auditDataArray.filter(data => data !== null);
  renderTable();
}

// Function to render the table
function renderTable() {
  const recentTrailsElement = document.getElementById('recenttrails');
  recentTrailsElement.innerHTML = '';

  const searchInput = document.getElementById('searchInput').value.toLowerCase();
  const userTypeFilter = document.getElementById('userTypeFilter').value;
  const dateFrom = document.getElementById('dateFrom').value ? new Date(document.getElementById('dateFrom').value) : null;
  const dateTo = document.getElementById('dateTo').value ? new Date(document.getElementById('dateTo').value) : null;

  const filteredData = auditDataArray.filter(data => {
    const matchesName = data.displayName.toLowerCase().includes(searchInput);
    const matchesUserType = userTypeFilter === '' || data.userType === userTypeFilter;

    // Check date range conditions using the transactionDate
    const transactionDate = new Date(data.transactionDate); // Use the raw date stored in the data

    if (dateFrom && transactionDate < dateFrom) return false; // Transaction date is before fromDate
    if (dateTo && transactionDate > dateTo) return false; // Transaction date is after toDate

    return matchesName && matchesUserType; // Return true if all conditions match
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const start = currentPage * rowsPerPage;
  const end = start + rowsPerPage;

  filteredData.slice(start, end).forEach(data => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${data.displayName}</td>
      <td>${data.userType}</td>
      <td>${data.action}</td>
      <td>${data.formattedTime}</td>
    `;
    recentTrailsElement.appendChild(row);
  });

  document.getElementById('prevPage').disabled = currentPage === 0;
  document.getElementById('nextPage').disabled = currentPage >= totalPages - 1;

  document.getElementById('pageInfo').textContent = `Page ${currentPage + 1} of ${totalPages}`;
}

// Event listeners for input changes
document.getElementById('searchInput').addEventListener('input', () => {
  currentPage = 0; // Reset to the first page on new search
  renderTable();
});

document.getElementById('userTypeFilter').addEventListener('change', () => {
  currentPage = 0; // Reset to the first page on new filter
  renderTable();
});

// Function for date filtering
document.getElementById('dateFrom').addEventListener('change', () => {
  currentPage = 0; // Reset to the first page on new date filter
  renderTable();
});

document.getElementById('dateTo').addEventListener('change', () => {
  currentPage = 0; // Reset to the first page on new date filter
  renderTable();
});

// Function for pagination
document.getElementById('prevPage').addEventListener('click', () => {
  if (currentPage > 0) {
    currentPage--;
    renderTable();
  }
});

document.getElementById('nextPage').addEventListener('click', () => {
  const totalPages = Math.ceil(auditDataArray.length / rowsPerPage);
  if (currentPage < totalPages - 1) {
    currentPage++;
    renderTable();
  }
});

// Call fetchAuditTrailData on page load
fetchAuditTrailData();
