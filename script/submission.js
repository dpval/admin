import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Variables for pagination
let currentPage = 1;
const postsPerPage = 10; // Number of posts per page
let totalPages = 1;
let currentPosts = [];

// Fetch posts based on filters and paginate
async function fetchClientPosts(filters = {}, page = 1) {
  const allPosts = document.getElementById("allUsers");
  const noPostsMessage = document.getElementById("noPostsMessage");

  allPosts.innerHTML = ""; // Clear the table content before populating
  noPostsMessage.style.display = "none"; // Hide 'no post' message by default

  const posts = []; // Array to store posts data

  try {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    let hasPosts = false;

    for (const userDoc of usersSnapshot.docs) {
      const postTaskCollection = collection(db, `users/${userDoc.id}/postTask`);
      let postTaskQuery = postTaskCollection;

      // Apply filters if provided
      if (filters.dateFrom) {
        postTaskQuery = query(
          postTaskQuery,
          where("createdtime", ">=", new Date(filters.dateFrom))
        );
      }
      if (filters.dateTo) {
        postTaskQuery = query(
          postTaskQuery,
          where("createdtime", "<=", new Date(filters.dateTo))
        );
      }
      if (filters.status) {
        postTaskQuery = query(
          postTaskQuery,
          where("status", "==", filters.status)
        );
      }

      const postTaskSnapshot = await getDocs(postTaskQuery);
      postTaskSnapshot.forEach((postDoc) => {
        const postData = postDoc.data();
        posts.push(postData); // Add post data to the array
        hasPosts = true; // Mark that we have at least one post
      });
    }

    if (!hasPosts) {
      noPostsMessage.style.display = "block"; // Show 'no post' message if no posts found
    }

    currentPosts = posts; // Store posts for pagination
    paginatePosts(page); // Display the posts for the current page

    return posts; // Return the collected posts for exporting
  } catch (error) {
    console.error("Error fetching client posts:", error);
  }
}

// Pagination function
function paginatePosts(page) {
  const allPosts = document.getElementById("allUsers");
  allPosts.innerHTML = ""; // Clear the table

  const startIndex = (page - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const paginatedPosts = currentPosts.slice(startIndex, endIndex);

  paginatedPosts.forEach((postData) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date(postData.createdtime.seconds * 1000).toLocaleString(
        "en-US",
        {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: true,
        }
      )}</td>
      <td>${postData.category}</td>
      <td>${postData.subcategory}</td>
      <td>${postData.barangay}</td>
      <td>${postData.applicationcount}</td>
      <td>${postData.status}</td>
      <td>${postData.urgent ? "Yes" : "No"}</td>
    `;
    allPosts.appendChild(row);
  });

  updatePaginationInfo();
}

// Update pagination buttons and info
function updatePaginationInfo() {
  const totalPosts = currentPosts.length;
  totalPages = Math.ceil(totalPosts / postsPerPage);

  document.getElementById(
    "pageInfo"
  ).textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;
}

// Event listeners for pagination buttons
document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    paginatePosts(currentPage);
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage++;
    paginatePosts(currentPage);
  }
});

// Function to apply filters based on input values
function applyFilters() {
  const dateFrom = document.getElementById("dateFrom").value;
  const dateTo = document.getElementById("dateTo").value;
  const statusFilter = document.getElementById("statusFilter").value;

  fetchClientPosts(
    {
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      status: statusFilter || null,
    },
    currentPage
  );
}

// Export functions
function exportToWord(posts) {
  let html = `<h1>Client Posts</h1><table style="width:100%; border-collapse: collapse;">
                <tr>
                  <th style="border: 1px solid black;">Date</th>
                  <th style="border: 1px solid black;">Category</th>
                  <th style="border: 1px solid black;">Subcategory</th>
                  <th style="border: 1px solid black;">Barangay</th>
                  <th style="border: 1px solid black;">Application Count</th>
                  <th style="border: 1px solid black;">Status</th>
                  <th style="border: 1px solid black;">Urgent</th>
                </tr>`;

  posts.forEach((post) => {
    html += `<tr>
                <td style="border: 1px solid black;">${new Date(
                  post.createdtime.seconds * 1000
                ).toLocaleString()}</td>
                <td style="border: 1px solid black;">${post.category}</td>
                <td style="border: 1px solid black;">${post.subcategory}</td>
                <td style="border: 1px solid black;">${post.barangay}</td>
                <td style="border: 1px solid black;">${
                  post.applicationcount
                }</td>
                <td style="border: 1px solid black;">${post.status}</td>
                <td style="border: 1px solid black;">${
                  post.urgent ? "Yes" : "No"
                }</td>
              </tr>`;
  });

  html += `</table>`;

  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "client_posts.doc";
  a.click();
  URL.revokeObjectURL(url);
}

function exportToExcel(posts) {
  const formattedData = posts.map((post) => ({
    Date: new Date(post.createdtime.seconds * 1000).toLocaleString(),
    Category: post.category,
    Subcategory: post.subcategory,
    Barangay: post.barangay,
    "Application Count": post.applicationcount,
    Status: post.status,
    Urgent: post.urgent ? "Yes" : "No",
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Client Posts");

  // Apply formatting to the header
  worksheet["!cols"] = [
    { wpx: 100 },
    { wpx: 100 },
    { wpx: 100 },
    { wpx: 100 },
    { wpx: 100 },
    { wpx: 100 },
    { wpx: 100 },
  ];

  XLSX.writeFile(workbook, "client_posts.xlsx");
}

// Event listeners for dynamic filtering by date range
document.getElementById("dateFrom").addEventListener("input", applyFilters);
document.getElementById("dateTo").addEventListener("input", applyFilters);
document
  .getElementById("statusFilter")
  .addEventListener("change", applyFilters);

// Event listener for Refresh button
document.getElementById("refreshBtn").addEventListener("click", () => {
  document.getElementById("dateFrom").value = "";
  document.getElementById("dateTo").value = "";
  document.getElementById("statusFilter").value = "";
  fetchClientPosts(); // Fetch all posts without any filter
});

// Event listener for Search button
document.getElementById("searchBtn").addEventListener("click", applyFilters);

document.getElementById("exportWord").addEventListener("click", () => {
  fetchClientPosts().then((posts) => exportToWord(posts));
});
document.getElementById("exportExcel").addEventListener("click", () => {
  fetchClientPosts().then((posts) => exportToExcel(posts));
});

// Fetch all posts on page load
document.addEventListener("DOMContentLoaded", () => {
  fetchClientPosts();
});
