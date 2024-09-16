import { db } from "../firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  where, // Import 'where' here
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Define time constants
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const currentTime = new Date().getTime();

document.addEventListener("DOMContentLoaded", () => {
  const activeUsersTable = document.getElementById("activeUsers");
  const searchInput = document.getElementById("searchInput");
  const filterButtons = document.querySelectorAll(".filter-btn");

  if (!activeUsersTable) {
    console.error("Element with ID 'activeUsers' not found.");
    return; // Exit if element is not found
  }

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
  // Fetch and display active users
function fetchAndDisplayActiveUsers(userTypeFilter = "") {
  try {
    let userQuery = query(
      collection(db, "users"),
      orderBy("created_time", "desc"),
      where("firsttimestatus", "==", "approved") // Add this filter
    );

    if (userTypeFilter && userTypeFilter !== "all") {
      userQuery = query(userQuery, where("usertype", "==", userTypeFilter));
    }

    onSnapshot(userQuery, (querySnapshot) => {
      console.log("Snapshot received");
      activeUsersTable.querySelector("tbody").innerHTML = ""; // Clear previous data

      querySnapshot.forEach((doc) => {
        const user = doc.data();
        console.log("User data:", user); // Log user data

        const { display_name, lastname, password, uid, isLogin, photo_url } = user;

        // Determine status based on last login
        let status = "Inactive";
        let statusColor = "#f8d7da"; // Light red
        if (isLogin instanceof Timestamp) {
          const lastLogin = isLogin.toMillis();
          status =
            currentTime - lastLogin <= ONE_DAY_IN_MS ? "Active" : "Inactive";
          statusColor = status === "Active" ? "#d4edda" : "#f8d7da"; // Light green for active
        }

        const tr = document.createElement("tr");

        // Name column with photo
        const nameTd = document.createElement("td");
        const photoElement = createPhotoElement(photo_url);
        const nameText = document.createElement("span");
        nameText.textContent = `${display_name || "N/A"} ${lastname || "N/A"}`;
        
        nameTd.appendChild(photoElement);
        nameTd.appendChild(nameText);

        const passwordTd = document.createElement("td");
        passwordTd.textContent = "******"; // Masked password

        const uidTd = document.createElement("td");
        uidTd.textContent = uid || "N/A";

        const statusTd = document.createElement("td");
        statusTd.textContent = status;
        statusTd.style.backgroundColor = statusColor;
        statusTd.style.color = status === "Active" ? "#155724" : "#721c24"; // Dark green for active, dark red for inactive
        statusTd.style.padding = "5px";
        statusTd.style.textAlign = "center";

        const lastLoginTd = document.createElement("td");
        lastLoginTd.textContent = formatDateTime(isLogin);

        // Append all columns to the row
        tr.appendChild(nameTd); // Name column with photo
        tr.appendChild(passwordTd);
        tr.appendChild(uidTd);
        tr.appendChild(statusTd);
        tr.appendChild(lastLoginTd);

        // Append the row to the table
        activeUsersTable.querySelector("tbody").appendChild(tr);
      });
    });
  } catch (error) {
    console.error("Error fetching active users: ", error);
  }
}


  // Event listener for search input
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();

    Array.from(activeUsersTable.querySelectorAll("tbody tr")).forEach((row) => {
      const name = row.querySelector("td:nth-child(1) span").textContent.toLowerCase(); // Search based on name column
      row.style.display = name.includes(searchTerm) ? "" : "none";
    });
  });

  // Event listener for filter buttons
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const userTypeFilter = button.getAttribute("data-filter");
      fetchAndDisplayActiveUsers(userTypeFilter);
    });
  });

  // Initial fetch of active users with no filter
  fetchAndDisplayActiveUsers();
});
