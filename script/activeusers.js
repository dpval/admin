import { db } from "../firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Define time constants
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const currentTime = new Date().getTime();

// Pagination variables
let currentPage = 0; // Track current page
const rowsPerPage = 6; // Number of rows per page
let userDataArray = []; // Store the filtered user data for pagination

document.addEventListener("DOMContentLoaded", () => {
  const activeUsersTable = document.getElementById("activeUsers");
  const searchInput = document.getElementById("searchInput");
  const filterButtons = document.querySelectorAll(".filter-btn");

  if (!activeUsersTable) {
    console.error("Element with ID 'activeUsers' not found.");
    return; // Exit if element is not found
  }

  let activeUserCount = 0;
  let inactiveUserCount = 0;
  let filteredDataArray = []; // Array to store filtered results for search

  // Format the date and time
  function formatDateTime(timestamp) {
    if (!(timestamp instanceof Timestamp)) {
      return "N/A";
    }

    const date = new Date(timestamp.toMillis());
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    };

    return new Intl.DateTimeFormat("en-US", options).format(date);
  }

  // Create and append a circular image with dynamic styling
  function createPhotoElement(photoUrl) {
    const img = document.createElement("img");
    img.src = photoUrl || "default-photo-url"; // Fallback to a default photo URL if none exists
    img.style.width = "25px"; // Adjust size as needed
    img.style.height = "25px"; // Adjust size as needed
    img.style.borderRadius = "50%"; // Make the image circular
    img.style.objectFit = "cover"; // Ensure image covers the circular area
    img.style.marginRight = "10px"; // Space between image and text
    return img;
  }

  // Fetch and display active users
  function fetchAndDisplayActiveUsers(userTypeFilter = "") {
    try {
      let userQuery = query(
        collection(db, "users"),
        orderBy("created_time", "desc"),
        where("firsttimestatus", "==", "approved")
      );

      if (userTypeFilter && userTypeFilter !== "all") {
        userQuery = query(userQuery, where("usertype", "==", userTypeFilter));
      }

      onSnapshot(userQuery, (querySnapshot) => {
        activeUserCount = 0;
        inactiveUserCount = 0;
        userDataArray = []; // Clear the previous data

        querySnapshot.forEach((doc) => {
          const user = doc.data();
          const { display_name, lastname, uid, isLogin, photo_url } = user;

          // Determine status based on last login
          let status = "Inactive";
          let statusColor = "#f8d7da"; // Light red
          if (isLogin instanceof Timestamp) {
            const lastLogin = isLogin.toMillis();
            status =
              currentTime - lastLogin <= ONE_DAY_IN_MS ? "Active" : "Inactive";
            statusColor = status === "Active" ? "#d4edda" : "#f8d7da"; // Light green for active
          }

          if (status === "Active") {
            activeUserCount++;
          } else {
            inactiveUserCount++;
          }

          // Push user data to the array for pagination
          userDataArray.push({
            displayName: `${display_name || "N/A"} ${lastname || "N/A"}`,
            uid: uid || "N/A",
            status: status,
            statusColor: statusColor,
            lastLogin: formatDateTime(isLogin),
            photoUrl: photo_url,
          });
        });

        // Copy userDataArray to filteredDataArray initially (for filtering)
        filteredDataArray = [...userDataArray];
        renderTable(); // Render the table with pagination
      });
    } catch (error) {
      console.error("Error fetching active users: ", error);
    }
  }

  // Function to render the table
  function renderTable() {
    const tbody = activeUsersTable.querySelector("tbody");
    tbody.innerHTML = ""; // Clear the previous rows

    const totalPages = Math.ceil(filteredDataArray.length / rowsPerPage);
    const start = currentPage * rowsPerPage;
    const end = start + rowsPerPage;

    filteredDataArray.slice(start, end).forEach((user) => {
      const tr = document.createElement("tr");

      // Name column with photo
      const nameTd = document.createElement("td");
      const photoElement = createPhotoElement(user.photoUrl);
      const nameText = document.createElement("span");
      nameText.textContent = user.displayName;

      nameTd.appendChild(photoElement);
      nameTd.appendChild(nameText);

      const uidTd = document.createElement("td");
      uidTd.textContent = user.uid;

      const statusTd = document.createElement("td");
      statusTd.textContent = user.status;
      statusTd.style.backgroundColor = user.statusColor;
      statusTd.style.color = user.status === "Active" ? "#155724" : "#721c24";
      statusTd.style.padding = "5px";
      statusTd.style.textAlign = "center";

      const lastLoginTd = document.createElement("td");
      lastLoginTd.textContent = user.lastLogin;

      // Append all columns to the row
      tr.appendChild(nameTd);
      tr.appendChild(uidTd);
      tr.appendChild(statusTd);
      tr.appendChild(lastLoginTd);

      // Append the row to the table
      tbody.appendChild(tr);
    });

    // Update pagination controls
    document.getElementById("prevPage").disabled = currentPage === 0;
    document.getElementById("nextPage").disabled = currentPage >= totalPages - 1;

    document.getElementById("pageInfo").textContent = `Page ${currentPage + 1} of ${totalPages}`;
  }

  // Event listeners for pagination
  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 0) {
      currentPage--;
      renderTable();
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    const totalPages = Math.ceil(filteredDataArray.length / rowsPerPage);
    if (currentPage < totalPages - 1) {
      currentPage++;
      renderTable();
    }
  });

  // Function to filter the data based on search input
  function filterData(query) {
    query = query.toLowerCase();
    filteredDataArray = userDataArray.filter((user) =>
      user.displayName.toLowerCase().includes(query)
    );
    currentPage = 0; // Reset to first page
    renderTable();
  }

  // Listen for input event to search dynamically
  searchInput.addEventListener("input", (event) => {
    filterData(event.target.value);
  });

  // Initial fetch of active users with no filter
  fetchAndDisplayActiveUsers();
});

