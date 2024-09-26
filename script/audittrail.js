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

      return { displayName, userType, action, formattedTime };
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

  const filteredData = auditDataArray.filter(data => {
    const matchesName = data.displayName.toLowerCase().includes(searchInput);
    const matchesUserType = userTypeFilter === '' || data.userType === userTypeFilter;
    return matchesName && matchesUserType;
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

// Function to handle search input changes
document.getElementById('searchInput').addEventListener('input', () => {
  currentPage = 0; // Reset to the first page on new search
  renderTable();
});

// Function to handle user type filter changes
document.getElementById('userTypeFilter').addEventListener('change', () => {
  currentPage = 0; // Reset to the first page on new filter
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
