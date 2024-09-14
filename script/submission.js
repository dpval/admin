import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Fetch posts based on filters
async function fetchClientPosts(filters = {}) {
  const allPosts = document.getElementById("allUsers");
  const noPostsMessage = document.getElementById("noPostsMessage");

  allPosts.innerHTML = ""; // Clear the table content before populating
  noPostsMessage.style.display = "none"; // Hide 'no post' message by default

  try {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);

    let hasPosts = false;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const postTaskCollection = collection(db, `users/${userDoc.id}/postTask`);

      let postTaskQuery = postTaskCollection;

      // Apply filters if provided
      if (filters.dateFrom) {
        postTaskQuery = query(postTaskQuery, where("createdtime", ">=", new Date(filters.dateFrom)));
      }
      if (filters.dateTo) {
        postTaskQuery = query(postTaskQuery, where("createdtime", "<=", new Date(filters.dateTo)));
      }
      if (filters.status) {
        postTaskQuery = query(postTaskQuery, where("status", "==", filters.status));
      }

      const postTaskSnapshot = await getDocs(postTaskQuery);

      postTaskSnapshot.forEach((postDoc) => {
        const postData = postDoc.data();
        hasPosts = true; // Mark that we have at least one post
        const row = document.createElement("tr");
        row.innerHTML = `
          <tr>
            <td>${new Date(postData.createdtime.seconds * 1000).toLocaleString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric', 
              hour: 'numeric', 
              minute: 'numeric', 
              second: 'numeric', 
              hour12: true 
            })}</td>
            <td>${postData.category}</td>
            <td>${postData.subcategory}</td>
            <td>${postData.barangay}</td>
            <td>${postData.applicationcount}</td>
            <td>${postData.status}</td>
            <td>${postData.urgent ? "Yes" : "No"}</td>
          </tr>
        `;
        allPosts.appendChild(row);
      });
    }

    if (!hasPosts) {
      noPostsMessage.style.display = "block"; // Show 'no post' message if no posts found
    }
  } catch (error) {
    console.error("Error fetching client posts:", error);
  }
}

// Function to apply filters based on input values
function applyFilters() {
  const dateFrom = document.getElementById("dateFrom").value;
  const dateTo = document.getElementById("dateTo").value;
  const statusFilter = document.getElementById("statusFilter").value;

  fetchClientPosts({
    dateFrom: dateFrom || null,
    dateTo: dateTo || null,
    status: statusFilter || null,
  });
}

// Event listener for dynamic filtering by date range
document.getElementById("dateFrom").addEventListener("input", applyFilters);
document.getElementById("dateTo").addEventListener("input", applyFilters);
document.getElementById("statusFilter").addEventListener("change", applyFilters);

// Event listener for Refresh button
document.getElementById("refreshBtn").addEventListener("click", () => {
  document.getElementById("dateFrom").value = "";
  document.getElementById("dateTo").value = "";
  document.getElementById("statusFilter").value = "";
  fetchClientPosts(); // Fetch all posts without any filter
});

// Event listener for Search button
document.getElementById("searchBtn").addEventListener("click", applyFilters);

// Fetch all posts on page load
document.addEventListener("DOMContentLoaded", () => {
  fetchClientPosts();
});