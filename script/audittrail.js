import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

let auditDataArray = []; // Store audit data for pagination

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

  const filteredData = auditDataArray.filter(item => {
    const matchesSearch = item.displayName.toLowerCase().includes(searchInput);
    const matchesUserType = userTypeFilter === '' || item.userType === userTypeFilter;

    // Only include specified user types
    const allowedUserTypes = ['admin', 'client', 'applicant'];
    const isAllowedUserType = allowedUserTypes.includes(item.userType);

    return matchesSearch && matchesUserType && isAllowedUserType;
  });

  filteredData.forEach(({ displayName, userType, action, formattedTime }) => {
    const newRow = `
      <tr>
        <td>${displayName}</td>
        <td>${userType}</td>
        <td>${action}</td>
        <td>${formattedTime}</td>
      </tr>
    `;
    recentTrailsElement.innerHTML += newRow;
  });
}

// Event listeners for search and filter
document.getElementById('searchInput').addEventListener('input', renderTable);
document.getElementById('userTypeFilter').addEventListener('change', renderTable);

// Export functions
document.getElementById('exportPdf').addEventListener('click', () => exportData('pdf'));
document.getElementById('exportWord').addEventListener('click', () => exportData('word'));
document.getElementById('exportExcel').addEventListener('click', () => exportData('excel'));

function exportData(format) {
    const allowedUserTypes = ['admin', 'client', 'applicant']; // Define allowed user types
  
    // Filter the audit data based on allowed user types
    const filteredData = auditDataArray.filter(item => {
      return allowedUserTypes.includes(item.userType);
    });
  
    // Populate the preview table
    const previewTableBody = document.getElementById('previewTable').querySelector('tbody');
    previewTableBody.innerHTML = ''; // Clear existing rows
  
    filteredData.forEach(({ displayName, userType, action, formattedTime }) => {
      const newRow = `
        <tr>
          <td>${displayName}</td>
          <td>${userType}</td>
          <td>${action}</td>
          <td>${formattedTime}</td>
        </tr>
      `;
      previewTableBody.innerHTML += newRow;
    });
  
    // Show the preview modal
    const modal = document.getElementById('previewModal');
    modal.style.display = 'block';
  
    // Handle confirm export
    document.getElementById('confirmExport').onclick = () => {
      // Call your actual export logic here based on the format
      alert(`Exporting data to ${format}`);
      modal.style.display = 'none'; // Close the modal after export
    };
  }
  

// Close the modal when the user clicks the close button
document.getElementById('closeModal').onclick = () => {
  const modal = document.getElementById('previewModal');
  modal.style.display = 'none';
};

// Close the modal if the user clicks anywhere outside of it
window.onclick = (event) => {
  const modal = document.getElementById('previewModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};


// Call the function to load the data when the page loads
window.onload = fetchAuditTrailData;
