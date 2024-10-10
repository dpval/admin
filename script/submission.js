import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Variables for pagination
let currentPage = 1;
const postsPerPage = 5; // Number of posts per page
let totalPages = 1;
let currentPosts = [];

// Fetch posts based on filters and paginate
async function fetchClientPosts(filters = {}, page = 1) {
  const allPosts = document.getElementById("allUsers");
  const noPostsMessage = document.getElementById("noPostsMessage");

  allPosts.innerHTML = ""; // Clear the table content before populating
  noPostsMessage.style.display = "none"; // Hide 'no post' message by default

  const posts = []; // Array to store posts data
  const currentDate = new Date(); // Get the current date and time
  const philippineTime = new Date().toLocaleString("en-US", {
    timeZone: 'Asia/Manila',
  });

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
          where("date", ">=", new Date(filters.dateFrom))
        );
      }
      if (filters.dateTo) {
        postTaskQuery = query(
          postTaskQuery,
          where("date", "<=", new Date(filters.dateTo))
        );
      }
      if (filters.status) {
        postTaskQuery = query(
          postTaskQuery,
          where("status", "==", filters.status)
        );
      }
      if (filters.urgent) {
        postTaskQuery = query(
          postTaskQuery,
          where("urgent", "==", filters.urgent)
        );
      }

      const postTaskSnapshot = await getDocs(postTaskQuery);
      postTaskSnapshot.forEach(async (postDoc) => {
        const postData = postDoc.data();

        // Get the timestamp and convert it to a Date object
        const postDate = new Date(postData.date.seconds * 1000);

        // Logic to update status based on conditions
        if (new Date(philippineTime) > postDate && postData.status !== "Salary Sent Back") {
          if (postData.status !== "Archived") {
            // If it's not already Archived or Salary Sent Back, set status to Archived
            await updateDoc(doc(db, `users/${userDoc.id}/postTask`, postDoc.id), {
              status: "Archived",
            });
            console.log(`Status set to Archived for post ${postDoc.id}`);
          }
        }

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
      <td>${new Date(postData.date.seconds * 1000).toLocaleString(
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
      <td>${postData.location}</td>
      <td>${postData.applicationcount}</td>
      <td>${postData.status}</td>
      <td>${
        postData.urgent === "Urgent" ? "Urgent" : "Not Urgent"
      }</td> <!-- Handle the urgent string here -->
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
  const urgentFilter = document.getElementById("urgentFilter").value; // Assuming urgent filter

  fetchClientPosts(
    {
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      status: statusFilter || null,
      urgent: urgentFilter || null, // Filter by "Urgent" or "Not Urgent"
    },
    currentPage
  );
}


// Export to Word
function exportToWord(posts) {
  let html = `<h1>Client Posts</h1><table style="width:100%; border-collapse: collapse;">
                <tr>
                  <th style="border: 1px solid black;">Date</th>
                  <th style="border: 1px solid black;">Category</th>
                  <th style="border: 1px solid black;">Subcategory</th>
                  <th style="border: 1px solid black;">Location</th>
                  <th style="border: 1px solid black;">Application Count</th>
                  <th style="border: 1px solid black;">Status</th>
                  <th style="border: 1px solid black;">Urgent</th>
                </tr>`;

  posts.forEach((post) => {
    html += `<tr>
                <td style="border: 1px solid black;">${new Date(
                  post.date.seconds * 1000
                ).toLocaleString()}</td>
                <td style="border: 1px solid black;">${post.category}</td>
                <td style="border: 1px solid black;">${post.subcategory}</td>
                <td style="border: 1px solid black;">${post.location}</td>
                <td style="border: 1px solid black;">${
                  post.applicationcount
                }</td>
                <td style="border: 1px solid black;">${post.status}</td>
                <td style="border: 1px solid black;">${
                  post.urgent === "Urgent" ? "Urgent" : "Not Urgent"
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

// Export to Excel
function exportToExcel(posts) {
  const formattedData = posts.map((post) => ({
    Date: new Date(post.date.seconds * 1000).toLocaleString(),
    Category: post.category,
    Subcategory: post.subcategory,
    Location: post.location,
    "Application Count": post.applicationcount,
    Status: post.status,
    Urgent: post.urgent === "Urgent" ? "Urgent" : "Not Urgent", // Handle urgent field here
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

document.addEventListener("DOMContentLoaded", () => {
  // Fetch elements and add event listeners only if they exist
  const dateFrom = document.getElementById("dateFrom");
  const dateTo = document.getElementById("dateTo");
  const statusFilter = document.getElementById("statusFilter");
  const urgentFilter = document.getElementById("urgentFilter");
  const searchBtn = document.getElementById("searchBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const exportWordBtn = document.getElementById("exportWord");
  const exportExcelBtn = document.getElementById("exportExcel");

  // Check if each element exists before attaching event listeners
  if (dateFrom) {
    dateFrom.addEventListener("input", applyFilters);
  }
  if (dateTo) {
    dateTo.addEventListener("input", applyFilters);
  }
  if (statusFilter) {
    statusFilter.addEventListener("change", applyFilters);
  }
  if (urgentFilter) {
    urgentFilter.addEventListener("change", applyFilters);
  }
  if (searchBtn) {
    searchBtn.addEventListener("click", applyFilters);
  }
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      // Reset filter fields and fetch posts
      if (dateFrom) dateFrom.value = "";
      if (dateTo) dateTo.value = "";
      if (statusFilter) statusFilter.value = "";
      if (urgentFilter) urgentFilter.value = "";
      fetchClientPosts(); // Fetch all posts without any filter
    });
  }
  if (exportWordBtn) {
    exportWordBtn.addEventListener("click", () => {
      fetchClientPosts().then((posts) => exportToWord(posts));
    });
  }
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener("click", () => {
      fetchClientPosts().then((posts) => exportToExcel(posts));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    fetchClientPosts(); // Fetch all posts on page load
  });
});
